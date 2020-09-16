import { InputType, Field } from "type-graphql";
@InputType()
export class UserChangeFieldsInput {
  @Field()
  username: string;
  @Field({ nullable: true })
  bio?: string;
  @Field({ nullable: true })
  publicLink?: string;
}
