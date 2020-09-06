import { Arg, Field, Int, ObjectType, Query, Resolver } from "type-graphql";
import Vote from "../entities/Vote";

@ObjectType()
class VoteValue {
  @Field(() => Int, { nullable: true })
  value: number | null;
}

@Resolver()
export default class VoteResolver {
  @Query(() => VoteValue)
  async voteInfo(
    @Arg("userId", () => Int) userId: number,
    @Arg("postId", () => Int) postId: number
  ): Promise<VoteValue> {
    const vote = await Vote.findOne({ where: { userId, postId } });
    if (vote) {
      const { value } = vote;
      return { value };
    }
    return { value: null };
  }
}
