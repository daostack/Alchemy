import * as React from "react";
import { Address, DAO, Vote, IProposalState } from "@daostack/arc.js";
import { Observable } from "rxjs";
import { standardPolling, humanProposalTitle } from "lib/util";
import { first } from "rxjs/operators";
import * as moment from "moment";
import { Link } from "react-router-dom";

const PAGE_SIZE = 50;

interface IExternalProps {
  daoName?: string;
  dao: DAO;
  profileAddress: Address;
}

const votesQuery = (
  dao: DAO,
  profileAddress: Address
): Observable<Array<Vote>> => {
  const filter: any = {};

  filter["voter"] = profileAddress;

  return dao.votes(
    {
      where: filter,
      first: PAGE_SIZE,
    },
    standardPolling(true)
  );
};

export const VotingHistory: React.FunctionComponent<IExternalProps> = (
  props: IExternalProps
) => {
  const [votes, setVotes] = React.useState([]);
  const [proposalMap, setProposalMap] = React.useState<{
    [index: string]: IProposalState;
  }>({});

  React.useEffect(() => {
    const fetchVotes = async () => {
      const votes = await votesQuery(props.dao, props.profileAddress)
        .pipe(first())
        .toPromise();

      await Promise.all(
        votes.map(async (v) => {
          const proposalValue = await props.dao
            .proposal(v.staticState.proposal)
            .state()
            .pipe(first())
            .toPromise();
          const obj = { [v.staticState.proposal]: proposalValue };
          setProposalMap((proposalMap) => ({ ...proposalMap, ...obj }));
        })
      );
      setVotes(votes);
    };
    fetchVotes();
  }, []);

  return (
    <>
      <div>
        <i>Total votes: {votes.length}</i>
      </div>
      <table>
        <tr>
          <th>Proposal</th>
          <th>In favor?</th>
          <th>Vote date</th>
        </tr>
        {votes.map((v) => {
          const vote = v.staticState;
          return (
            <>
              <tr>
                <td>
                  <Link
                    to={"/dao/" + props.dao.id + "/proposal/" + vote.proposal}
                  >
                    {humanProposalTitle(proposalMap[vote.proposal])}
                  </Link>
                </td>
                <td>{vote.outcome ? "For" : "Against"}</td>
                <td>{moment.unix(vote.createdAt).format("lll")}</td>
              </tr>
            </>
          );
        })}
      </table>
    </>
  );
};
