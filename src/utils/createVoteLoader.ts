import DataLoader from "dataloader";
import Vote from "../entities/Vote";

interface VoteParams {
  postId: number;
  userId: number;
}

export const createVoteLoader = () =>
  new DataLoader<VoteParams, Vote | null>(async (keys) => {
    const votes = await Vote.findByIds(keys as VoteParams[]);
    const voteIdsToVote: Record<string, Vote> = {};
    votes.forEach((v) => {
      voteIdsToVote[`${v.userId}|${v.postId}`] = v;
    });
    return keys.map((key) => voteIdsToVote[`${key.userId}|${key.postId}`]);
  });
