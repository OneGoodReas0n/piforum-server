import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import Avatar from "./Avatar";
import Post from "./Post";
import Vote from "./Vote";

@ObjectType()
@Entity()
export default class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field(() => String)
  @Column({ unique: true })
  username!: string;

  @Field(() => String)
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  description!: string;

  @OneToMany(() => Post, (post: Post) => post.creator)
  posts: Post[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @Field(() => Int, { nullable: true, defaultValue: null })
  @Column({ nullable: true, default: null })
  avatarId: number;

  @OneToOne(() => Avatar, (avatar) => avatar.user, { nullable: true })
  avatar: Avatar;
}
