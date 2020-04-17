import { IDAOState } from "@daostack/client";
import FollowButton from "components/Shared/FollowButton";
// import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";

type IExternalProps = {
  daoState: IDAOState;
};

type IProps = IExternalProps; // & ISubscriptionProps<IDAOState>

export default class DaoLandingPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  public render() {
    const daoState = this.props.daoState;

    return (
      <div className={css.landingPage}>

        <div className={css.heading}>
          <div className={css.name}>{daoState.name}</div>
          <FollowButton id={daoState.id} type="daos" />
        </div>

        <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

        <div className={css.infoContainer}>
          <div className={css.members}>
            <div className={css.count}>{daoState.memberCount || "0"}</div>
            <div className={css.body}>Members</div>
          </div>
          <div className={css.proposals}>
            <div className={css.count}>{daoState.numberOfQueuedProposals+ daoState.numberOfBoostedProposals + daoState.numberOfPreBoostedProposals}</div>
            <div className={css.body}>Open Proposals</div>
          </div>
        </div>

        <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
          make a proposal to the DAO or vote on existing proposals.</div>

        <div className={css.visitWall}>Visit the <Link to={`/dao/${daoState.address}/discussion/`}>DAO Wall</Link> to
          participate in general discussion about this DAO.</div>
      </div>
    );
  }
}

// export default withSubscription({
//   wrappedComponent: DaoLandingPage,
//   loadingComponent: null,
//   errorComponent: (props) => <div>{ props.error.message }</div>,

//   checkForUpdate: (oldProps, newProps) => {
//     return oldProps.dao.id !== newProps.dao.id;
//   },

//   createObservable: (props: IExternalProps) => {
//     const dao = props.dao;
//     return dao.state();
//   },
// });
