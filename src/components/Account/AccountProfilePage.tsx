import { IDAOState, IMemberState, DAO } from "@daostack/arc.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getProfile, updateProfile } from "@store/profiles/profilesActions";
import { enableWalletProvider } from "arc";
import classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import Reputation from "components/Account/Reputation";
import FollowButton from "components/Shared/FollowButton";
import ThreeboxModal from "components/Shared/ThreeboxModal";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { Field, Formik, FormikProps } from "formik";
import Analytics from "lib/analytics";
import { standardPolling, getArcByDAOAddress, getNetworkByDAOAddress} from "lib/util";
import CopyToClipboard, { IconColor } from "components/Shared/CopyToClipboard";
import { Page } from "pages";
import { parse } from "query-string";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { IRootState } from "@store";
import { showNotification } from "@store/notifications/notifications.reducer";
import { IProfileState } from "@store/profiles/profilesReducer";
import { combineLatest, of } from "rxjs";
import Loading from "components/Shared/Loading";
import * as css from "./Account.scss";
import {VotingHistory} from "./VotingHistory";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  accountAddress: string;
  accountProfile?: IProfileState;
  currentAccountAddress: string;
  daoAvatarAddress: string;
  threeBox: any;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
  getProfile: typeof getProfile;
  updateProfile: typeof updateProfile;
}

type SubscriptionData = [IDAOState, IMemberState];
type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const accountAddress = ownProps.match.params.accountAddress ? ownProps.match.params.accountAddress.toLowerCase() : null;
  const queryValues = parse(ownProps.location.search);
  const daoAvatarAddress = queryValues.daoAvatarAddress as string;

  return {
    ...ownProps,
    accountAddress,
    accountProfile: state.profiles[accountAddress],
    currentAccountAddress: state.web3.currentAccountAddress,
    daoAvatarAddress,
    threeBox: state.profiles.threeBox,
  };
};

const mapDispatchToProps = {
  getProfile,
  updateProfile,
  showNotification,
};

interface IFormValues {
  description: string;
  name: string;
}

interface IState {
  description: string;
  name: string;
  showThreeBoxModal: boolean;
}

class AccountProfilePage extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    const accountProfile = props.accountProfile;

    this.state = {
      description: accountProfile ? accountProfile.description || "" : "",
      name: accountProfile ? accountProfile.name || "" : "",
      showThreeBoxModal: false,
    };
  }

  public async componentDidMount(): Promise<void> {
    const { accountAddress, getProfile, accountProfile} = this.props;

    if (!accountProfile) {
      getProfile(accountAddress);
    }

    const dao = this.props.data[0];

    Analytics.track("Page View", {
      "Page Name": Page.AccountProfile,
      "DAO Address": dao ? dao.address : "",
      "DAO Name": dao ? dao.name : "",
      "Profile Address": this.props.accountAddress,
    });
  }

  public doUpdateProfile = async() => {
    const { currentAccountAddress, updateProfile } = this.props;
    await updateProfile(currentAccountAddress, this.state.name, this.state.description);
  }

  public handleFormSubmit = async (values: IFormValues, { _props, setSubmitting, _setErrors }: any): Promise<void> => {
    const { currentAccountAddress, showNotification, updateProfile } = this.props;

    if (!await enableWalletProvider({ showNotification }, getNetworkByDAOAddress(this.props.daoAvatarAddress))) { setSubmitting(false); return; }

    if (this.props.threeBox || parseInt(localStorage.getItem("dontShowThreeboxModal"))) {
      await updateProfile(currentAccountAddress, values.name, values.description);
    } else {
      this.setState({ showThreeBoxModal: true, description: values.description, name: values.name });
    }

    setSubmitting(false);
  }

  private closeThreeboxModal = (_e: any): void => {
    this.setState({ showThreeBoxModal: false });
  }

  public render(): RenderOutput {
    const [dao, accountInfo] = this.props.data;

    const { accountAddress, accountProfile, currentAccountAddress } = this.props;

    if (!accountProfile) {
      return <Loading/>;
    }

    // TODO: dont show profile until loaded from 3box
    const editing = currentAccountAddress && accountAddress === currentAccountAddress;

    const profileContainerClass = classNames({
      [css.profileContainer]: true,
      [css.withDao]: !!dao,
    });

    return (
      <div className={css.profileWrapper}>
        <BreadcrumbsItem to={`/profile/${accountAddress}`}>
          {editing ? (accountProfile && accountProfile.name ? "Edit 3Box Profile" : "Set 3Box Profile") : "View 3Box Profile"}
        </BreadcrumbsItem>
        <Helmet>
          <meta name="description" content={(accountProfile.name || accountProfile.ethereumAccountAddress) + " Profile on Alchemy by DAOstack"} />
          <meta name="og:description" content={(accountProfile.name || accountProfile.ethereumAccountAddress) + " Profile on Alchemy by DAOstack"} />
          <meta name="twitter:description" content={(accountProfile.name || accountProfile.ethereumAccountAddress) + " Profile on Alchemy by DAOstack"} />
        </Helmet>

        {this.state.showThreeBoxModal ?
          <ThreeboxModal action={this.doUpdateProfile} closeHandler={this.closeThreeboxModal} />
          : ""}

        <div className={profileContainerClass} data-test-id="profile-container">
          { editing && (!accountProfile || !accountProfile.name) ? <div className={css.setupProfile}>In order to evoke a sense of trust and reduce risk of scams, we invite you to create a user profile which will be associated with your current Ethereum address.<br/><br/></div> : ""}
          { typeof(accountProfile) === "undefined" ? "Loading..." :
            <Formik
              enableReinitialize
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              initialValues={{
                description: accountProfile ? accountProfile.description || "" : "",
                name: accountProfile ? accountProfile.name || "" : "",
              } as IFormValues}
              // eslint-disable-next-line react/jsx-no-bind
              validate={(values: IFormValues): void => {
                // const { name } = values;
                const errors: any = {};

                const require = (name: string): any => {
                  if (!(values as any)[name]) {
                    errors[name] = "Required";
                  }
                };

                require("name");

                return errors;
              }}
              onSubmit={this.handleFormSubmit}
              // eslint-disable-next-line react/jsx-no-bind
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                values,
                errors,
                touched,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                handleChange,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                handleBlur,
                handleSubmit,
                isSubmitting,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                isValid,
              }: FormikProps<IFormValues>) =>
                <form onSubmit={handleSubmit} noValidate>
                  <div className={css.profileContent}>
                    <div className={css.profileDataContainer}>
                      <div className={css.userAvatarContainer}>
                        <AccountImage accountAddress={accountAddress} profile={accountProfile} width={70} />
                      </div>
                      <div className={css.profileData}>
                        <label htmlFor="nameInput">
                          Name:&nbsp;
                        </label>
                        {editing ?
                          <div>
                            <Field
                              autoFocus
                              id="nameInput"
                              placeholder="e.g. John Doe"
                              name="name"
                              type="text"
                              maxLength="35"
                              className={touched.name && errors.name ? css.error : null}
                            />
                            {touched.name && errors.name && <span className={css.errorMessage}>{errors.name}</span>}
                          </div>
                          : <div>{accountProfile.name ?? "[Unknown]"}</div>
                        }
                        <br />
                        <label htmlFor="descriptionInput">
                          Description:&nbsp;
                        </label>
                        {editing ?
                          <div>
                            <div>
                              <Field
                                id="descriptionInput"
                                placeholder="Tell the DAO a bit about yourself"
                                name="description"
                                component="textarea"
                                maxLength="150"
                                rows="7"
                                className={touched.description && errors.description ? css.error : null}
                              />
                              <div className={css.charLimit}>Limit 150 characters</div>
                            </div>
                            <div className={css.saveProfile}>
                              <button className={css.submitButton} type="submit" disabled={isSubmitting}>
                                <img className={css.loading} src="/assets/images/Icon/Loading-black.svg" />
                                SUBMIT
                              </button>
                            </div>
                          </div>

                          : <div>{accountProfile.description ?? "[Unknown]"}</div>
                        }
                      </div>
                    </div>
                    { editing ? "" : <div className={css.followButton}><FollowButton id={accountAddress} type="users" network={getNetworkByDAOAddress(this.props.daoAvatarAddress)} /></div> }
                    {Object.keys(accountProfile.socialURLs).length === 0 ? " " :
                      <div className={css.socialLogins}>
                        <h3>Social Verification</h3>

                        {editing
                          ? <div className={css.socialProof}>
                            <img src="/assets/images/Icon/Alert-yellow.svg" /> Prove it&apos;s you by linking your social accounts through 3box.
                          </div>
                          : " "
                        }

                        <a href={accountProfile.socialURLs.twitter ? "https://twitter.com/" + accountProfile.socialURLs.twitter.username : "https://3box.io/" + accountAddress} className={css.socialButtonAuthenticated} target="_blank" rel="noopener noreferrer">
                          <FontAwesomeIcon icon={["fab", "twitter"]} className={css.icon} /> {accountProfile.socialURLs.twitter ? "Verified as https://twitter.com/" + accountProfile.socialURLs.twitter.username : "Verify Twitter through 3box"}
                        </a>
                        <br/>
                        <a href={accountProfile.socialURLs.github ? "https://github.com/" + accountProfile.socialURLs.github.username : "https://3box.io/" + accountAddress} className={css.socialButtonAuthenticated} target="_blank" rel="noopener noreferrer">
                          <FontAwesomeIcon icon={["fab", "github"]} className={css.icon} /> {accountProfile.socialURLs.github ? "Verified as https://github.com/" + accountProfile.socialURLs.github.username : "Verify Github through 3box"}
                        </a>
                      </div>
                    }
                    <div className={css.otherInfoContainer}>
                      <div className={css.tokens}>
                        {(accountInfo && dao)
                          ? <div><strong>Rep. Score</strong><br /><Reputation reputation={accountInfo.reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /> </div>
                          : ""}
                      </div>
                      <div>
                        <strong>ETH Address:</strong><br />
                        <span>{accountAddress.substr(0, 20)}...</span>
                        <CopyToClipboard value={accountAddress} color={IconColor.Black}/>
                      </div>
                    </div>
                    <div>
                      <strong>Voting History</strong><br/>
                      <span><VotingHistory dao={dao.dao} profileAddress={this.props.accountAddress} ></VotingHistory></span>
                    </div>
                  </div>
                </form>
              }
            />
          }
        </div>
      </div>
    );
  }
}

const SubscribedAccountProfilePage = withSubscription({
  wrappedComponent: AccountProfilePage,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.daoAvatarAddress !== newProps.daoAvatarAddress || oldProps.accountAddress !== newProps.accountAddress;
  },

  createObservable: (props: IProps) => {
    const queryValues = parse(props.location.search);
    const daoAvatarAddress = queryValues.daoAvatarAddress as string;
    const accountAddress = props.match.params.accountAddress;
    let dao: DAO;
    if (daoAvatarAddress) {
      const arc = getArcByDAOAddress(queryValues.daoAvatarAddress as string);
      dao = arc.dao(daoAvatarAddress);
    }

    return combineLatest(
      // subscribe if only to to get DAO reputation supply updates
      daoAvatarAddress ? dao.state( standardPolling()) : of(null),
      daoAvatarAddress ? dao.member(accountAddress).state() : of(null),
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedAccountProfilePage);
