import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import User from "./User";
import Vote from "./Vote";

@ObjectType()
@Entity()
export default class Post extends BaseEntity {
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
  title!: string;

  @Field(() => String)
  @Column()
  text!: string;

  @Field(() => Number)
  @Column({ type: "int", default: 0 })
  points: number;

  @Field(() => Number)
  @Column()
  creatorId: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field(() => Number, { nullable: true })
  voteStatus: number;

  @OneToMany(() => Vote, (vote) => vote.post)
  votes: Vote[];
}
