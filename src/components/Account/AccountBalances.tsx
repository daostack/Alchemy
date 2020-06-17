import { Address, IMemberState, IDAOState, Member } from "@daostack/arc.js";
import { baseTokenName, ethErrorHandler, genName } from "lib/util";
import { getArc } from "arc";

import BN = require("bn.js");
import AccountBalance from "components/Account/AccountBalance";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as css from "layouts/App.scss";
import * as React from "react";
import { combineLatest, of } from "rxjs";

interface IExternalProps {
  daoState?: IDAOState;
  accountAddress: Address;
}

type IProps = IExternalProps & ISubscriptionProps<[IMemberState, BN|null, BN|null]>

class AccountBalances extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { daoState, accountAddress, data } = this.props;

    if (!data) {
      return null;
    }

    const [currentAccountState, ethBalance, genBalance] = data;

    return (
      <div className={css.balances}>
        <h2>Reputation</h2>
        {daoState && currentAccountState ?
          <div className={css.daoBalance}>
            <b>{daoState.name}</b>
            <Reputation daoName={daoState.name} totalReputation={daoState.reputationTotalSupply} reputation={currentAccountState.reputation} hideTooltip/>
          </div>
          :
          <div className={css.noReputation}>
              No Reputation
          </div>
        }
        <div className={css.userBalance}>
          <h2>Holdings</h2>
          <div>
            <AccountBalance tokenSymbol={baseTokenName()} balance={ethBalance} accountAddress={accountAddress} />
          </div>
          <div>
            <AccountBalance tokenSymbol={genName()} balance={genBalance} accountAddress={accountAddress} />
          </div>
        </div>
      </div>
    );
  }
}

export default withSubscription({
  wrappedComponent: AccountBalances,
  loadingComponent: <div>Loading..</div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: (oldProps, newProps) => {
    const oldDao = oldProps.daoState;
    const newDao = newProps.daoState;
    return oldProps.accountAddress !== newProps.accountAddress || (oldDao && oldDao.address) !== (newDao && newDao.address);
  },

  createObservable: async ({ daoState, accountAddress }: IExternalProps) => {
    if (!daoState) {
      return of(null);
    }
    const arc = getArc();
    const member = accountAddress ? new Member(arc, Member.calculateId({
      contract: daoState.reputation.id,
      address: accountAddress,
    })) : undefined;

    return combineLatest(
      member ? member.state( { subscribe: true }).pipe(ethErrorHandler()) : of(null),
      arc.ethBalance(accountAddress).pipe(ethErrorHandler()),
      arc.GENToken().balanceOf(accountAddress).pipe(ethErrorHandler())
    );
  },
});
