import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import Post from "../entities/Post";
import Vote from "../entities/Vote";
import { isAuth } from "../middleware/isAuth";
import { Context } from "../types";
import { FieldError } from "./user";
import User from "../entities/User";

@ObjectType()
class PostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Post, { nullable: true })
  post?: Post;
}

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export default class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() post: Post) {
    return post.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: Context) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int)
  async voteStatus(@Root() post: Post, @Ctx() { voteLoader, req }: Context) {
    if (!req.session.userId) {
      return null;
    }
    const vote = await voteLoader.load({
      userId: req.session.userId,
      postId: post.id,
    });

    return vote ? vote.value : null;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const queryBase = getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      .orderBy('post."createdAt"', "DESC")
      .limit(realLimitPlusOne);
    if (cursor) {
      queryBase.where('post."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const posts = await queryBase.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: Context
  ) {
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;
    const { userId } = req.session;

    const vote = await Vote.findOne({ where: { postId, userId } });

    const post = await Post.findOne({ id: postId });

    if (!vote) {
      await Vote.insert({
        userId,
        postId,
        value: realValue,
      });
    } else if (vote.value !== value) {
      vote.value = value;
      Vote.save(vote);
    } else {
      return false;
    }
    await Post.update(
      { id: postId },
      { points: post!.points + (vote?.value ? 2 * realValue : realValue)  }
    );
    return true;
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: Context
  ): Promise<Post> {
    const creatorId = req.session.userId;
    const post = await Post.create({
      ...input,
      creatorId,
    }).save();
    return post;
  }

  @Mutation(() => PostResponse, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: Context
  ): Promise<PostResponse | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (title.length === 0) {
      return {
        errors: [{ field: "title", message: "Title shouldn't be empty" }],
      };
    } else if (
      text.match(new RegExp("[a-zA-Z]+", "gm")) === null ||
      text.match(new RegExp("[a-zA-Z]+", "gm"))!.length < 3
    ) {
      return {
        errors: [
          {
            field: "text",
            message: "Field text should contain at least 3 words",
          },
        ],
      };
    }

    if (!post.creatorId === req.session.userId) {
      throw new Error("You don't have permit to edit this post");
    }

    const updatedPost = await getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :userId ', {
        id,
        userId: req.session.userId,
      })
      .returning("*")
      .execute();

    return { post: updatedPost.raw[0] };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: Context
  ): Promise<Boolean> {
    const post = await Post.findOne({ id });
    if (!post) {
      return false;
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error("User doesn't have a permit to delete Post");
    }
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
