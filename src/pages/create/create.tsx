import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { setRecoil } from 'recoil-nexus';
import { Button, Checkbox, Form, Input, InputNumber, notification, Select, Typography } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { useTranslation } from 'react-i18next';
import {
  walletIdentifierState,
  walletTempBackupState,
  sessionState,
  ledgerIsConnectedState,
  LedgerConnectedApp,
} from '../../recoil/atom';
import './create.less';
import { Wallet } from '../../models/Wallet';
import { walletService } from '../../service/WalletService';
import { WalletCreateOptions, WalletCreator } from '../../service/WalletCreator';
import {
  DefaultWalletConfigs,
  LedgerWalletMaximum,
  NetworkName,
  NodePorts,
  SupportedChainName,
} from '../../config/StaticConfig';
import logo from '../../assets/logo-products-chain.svg';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
// import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
// import PasswordFormContainer from '../../components/PasswordForm/PasswordFormContainer';
import BackButton from '../../components/BackButton/BackButton';
import { secretStoreService } from '../../service/storage/SecretStoreService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import LedgerModalPopup from '../../components/LedgerModalPopup/LedgerModalPopup';
import SuccessCheckmark from '../../components/SuccessCheckmark/SuccessCheckmark';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NoticeDisclaimer from '../../components/NoticeDisclaimer/NoticeDisclaimer';
import { ledgerNotificationWithoutCheck } from '../../components/LedgerNotification/LedgerNotification';
import IconLedger from '../../svg/IconLedger';
import { UserAssetType } from '../../models/UserAsset';
import { ISignerProvider } from '../../service/signers/SignerProvider';
import {
  createLedgerDevice,
  detectConditionsError,
  LEDGER_WALLET_TYPE,
  NORMAL_WALLET_TYPE,
} from '../../service/LedgerService';
import IconCro from '../../svg/IconCro';
import IconEth from '../../svg/IconEth';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import LedgerAddressIndexBalanceTable from './components/LedgerAddressIndexBalanceTable';
import { useLedgerStatus } from '../../hooks/useLedgerStatus';
import { DerivationPathStandard, LedgerSigner } from '../../service/signers/LedgerSigner';
import IconCosmos from '../../svg/IconCosmos';

let waitFlag = false;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const { Text } = Typography;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface FormCustomConfigProps {
  setIsConnected: (arg: boolean) => void;
  setIsCreateDisable: (arg: boolean) => void;
  setNetworkConfig: (arg: any) => void;
}

interface FormCreateProps {
  form: FormInstance;
  isCreateDisable: boolean;
  isNetworkSelectFieldDisable: boolean;
  isWalletSelectFieldDisable: boolean;
  setWalletIdentifier: (walletIdentifier: string) => void;
  setIsCustomConfig: (arg: boolean) => void;
  setIsConnected: (arg: boolean) => void;
  setIsCreateDisable: (arg: boolean) => void;
  setIsNetworkSelectFieldDisable: (arg: boolean) => void;
  setIsWalletSelectFieldDisable: (arg: boolean) => void;
  networkConfig: any;
}

const FormCustomConfig: React.FC<FormCustomConfigProps> = props => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checkingNodeConnection, setCheckingNodeConnection] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  const [t] = useTranslation();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    props.setIsConnected(true);
    props.setIsCreateDisable(false);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const handleErrorOk = () => {
    setIsErrorModalVisible(false);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
  };

  const checkNodeConnectivity = async () => {
    // TO-DO Node Connectivity check
    form.validateFields().then(async values => {
      setCheckingNodeConnection(true);
      const { nodeUrl } = values;
      const isNodeLive = await walletService.checkNodeIsLive(`${nodeUrl}${NodePorts.Tendermint}`);
      setCheckingNodeConnection(false);

      if (isNodeLive) {
        showModal();
        props.setNetworkConfig(values);
      } else {
        showErrorModal();
      }
    });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      name="control-ref"
      initialValues={{
        indexingUrl: DefaultWalletConfigs.TestNetConfig.indexingUrl,
        nodeUrl: 'http://127.0.0.1',
        derivationPath: 'm/44\'/394\'/0\'/0/0',
        validatorPrefix: 'crocncl',
        croDenom: 'cro',
        baseDenom: 'basecro',
        chainId: 'test',
        addressPrefix: 'cro',
      }}
    >
      <Form.Item
        name="nodeUrl"
        label={t('create.formCustomConfig.nodeUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('create.formCustomConfig.nodeUrl.label')} ${t('general.required')}`,
          },
          {
            type: 'url',
            message: t('create.formCustomConfig.nodeUrl.error1'),
          },
        ]}
      >
        <Input placeholder={t('create.formCustomConfig.nodeUrl.label')} />
      </Form.Item>

      <Form.Item
        name="indexingUrl"
        label={t('create.formCustomConfig.indexingUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('create.formCustomConfig.indexingUrl.label')} ${t('general.required')}`,
          },
          {
            type: 'url',
            message: t('create.formCustomConfig.indexingUrl.error1'),
          },
        ]}
      >
        <Input placeholder={t('create.formCustomConfig.indexingUrl.label')} />
      </Form.Item>

      <div className="row">
        <Form.Item
          name="derivationPath"
          label={t('create.formCustomConfig.derivationPath.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('create.formCustomConfig.derivationPath.label')} ${t(
                'general.required',
              )}`,
            },
            {
              pattern: /^m\/\d+'?\/\d+'?\/\d+'?\/\d+'?\/\d+'?$/,
              message: t('create.formCustomConfig.derivationPath.error1'),
            },
          ]}
        >
          <Input maxLength={64} placeholder={t('create.formCustomConfig.derivationPath.label')} />
        </Form.Item>
        <Form.Item
          name="validatorPrefix"
          label={t('create.formCustomConfig.validatorPrefix.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('create.formCustomConfig.validatorPrefix.label')} ${t(
                'general.required',
              )}`,
            },
          ]}
        >
          <Input placeholder={t('create.formCustomConfig.validatorPrefix.label')} />
        </Form.Item>
      </div>

      <div className="row">
        <Form.Item
          name="addressPrefix"
          label={t('create.formCustomConfig.addressPrefix.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('create.formCustomConfig.addressPrefix.label')} ${t(
                'general.required',
              )}`,
            },
          ]}
        >
          <Input placeholder={t('create.formCustomConfig.addressPrefix.label')} />
        </Form.Item>
        <Form.Item
          name="chainId"
          label={t('create.formCustomConfig.chainId.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('create.formCustomConfig.chainId.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('create.formCustomConfig.chainId.label')} />
        </Form.Item>
      </div>
      <div className="row">
        <Form.Item
          name="baseDenom"
          label={t('create.formCustomConfig.baseDenom.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('create.formCustomConfig.baseDenom.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('create.formCustomConfig.baseDenom.label')} />
        </Form.Item>
        <Form.Item
          name="croDenom"
          label={t('create.formCustomConfig.croDenom.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('create.formCustomConfig.croDenom.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('create.formCustomConfig.croDenom.label')} />
        </Form.Item>
      </div>

      <SuccessModalPopup
        isModalVisible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        title={t('general.successModalPopup.title')}
        button={
          <Button type="primary" onClick={checkNodeConnectivity} loading={checkingNodeConnection}>
            {t('general.connect')}
          </Button>
        }
        footer={[
          <Button key="submit" type="primary" onClick={handleOk}>
            {t('general.continue')}
          </Button>,
        ]}
      >
        <>
          <div className="description">
            {t('general.successModalPopup.nodeConnect.description')}
          </div>
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={handleErrorCancel}
        handleOk={handleErrorOk}
        title={t('general.errorModalPopup.title')}
        footer={[]}
      >
        <>
          <div className="description">{t('general.errorModalPopup.nodeConnect.description')}</div>
        </>
      </ErrorModalPopup>
    </Form>
  );
};

const FormCreate: React.FC<FormCreateProps> = props => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isCroModalVisible, setIsCroModalVisible] = useState(false);
  const [isEthModalVisible, setIsEthModalVisible] = useState(false);
  const [isCosmosModalVisible, setIsCosmosModalVisible] = useState(false);
  const [isHWModeSelected, setIsHWModeSelected] = useState(false);
  const [isLedgerModalButtonLoading, setIsLedgerModalButtonLoading] = useState(false);
  // eslint-disable-next-line
  const [isLedgerEthAppConnected, setIsLedgerEthAppConnected] = useState(false);
  const [isLedgerCroAppConnected, setIsLedgerCroAppConnected] = useState(false);
  const [isLedgerCosmosAppConnected, setIsLedgerCosmosAppConnected] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet>();
  const [ledgerAssetType, setLedgerAssetType] = useState<UserAssetType>();
  const [ledgerChainName, setLedgerChainName] = useState<SupportedChainName>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [walletTempBackupSeed, setWalletTempBackupSeed] = useRecoilState(walletTempBackupState);
  const [hwcheck, setHwcheck] = useState(!props.isWalletSelectFieldDisable);
  const { isLedgerConnected } = useLedgerStatus({ assetType: ledgerAssetType, chainName: ledgerChainName });
  const [ledgerAddressList, setLedgerAddressList] = useState<any[]>([]);
  const [derivationPath, setDerivationPath] = useState({
    cronosTendermint: 'm/44\'/394\'/0\'/0/0',
    cosmosTendermint: 'm/44\'/118\'/0\'/0/0',
    evm: 'm/44\'/60\'/0\'/0/0',
  });

  const [t] = useTranslation();

  // for eth ledger
  const showEthModal = () => {
    setIsEthModalVisible(true);
  };
  const handleEthOk = () => {
    waitFlag = false;
  };
  const handleEthCancel = () => {
    waitFlag = false;
    setIsEthModalVisible(false);
  };

  const handleCroOk = () => {
    setIsCroModalVisible(false);
  };

  const handleCroCancel = () => {
    setIsCroModalVisible(false);
  };

  const showCosmosModal = () => {
    setIsCosmosModalVisible(true);
  };
  const handleCosmosOk = () => {
    waitFlag = false;
  };

  const handleCosmosCancel = () => {
    waitFlag = false;
    setIsCosmosModalVisible(false);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
    props.setWalletIdentifier(wallet?.identifier ?? '');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    props.setWalletIdentifier(wallet?.identifier ?? '');
  };

  const handleErrorOk = () => {
    setIsErrorModalVisible(false);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const onChange = () => {
    const { name } = props.form.getFieldsValue();
    if (typeof name === 'undefined') {
      props.setIsNetworkSelectFieldDisable(true);
    } else if (name !== '') {
      props.setIsNetworkSelectFieldDisable(false);
    } else {
      props.setIsNetworkSelectFieldDisable(true);
    }
  };

  const onCheckboxChange = e => {
    setHwcheck(!hwcheck);
    props.setIsWalletSelectFieldDisable(!e.target.checked);
    if (e.target.checked)
      props.form.setFieldsValue({
        walletType: LEDGER_WALLET_TYPE,
        derivationPathStandard: DerivationPathStandard.BIP44,
      });
    else props.form.setFieldsValue({ walletType: NORMAL_WALLET_TYPE });
  };

  const onNetworkChange = (network: string) => {
    setLedgerAddressList([]);
    props.form.setFieldsValue({ network });
    if (network === DefaultWalletConfigs.CustomDevNet.name) {
      props.setIsCustomConfig(true);
      props.setIsConnected(false);
      props.setIsCreateDisable(true);
    }
  };

  // eslint-disable-next-line
  const onWalletCreateFinishCore = async () => {
    setCreateLoading(true);
    const {
      addressIndex,
      name,
      walletType,
      network,
      derivationPathStandard,
    } = props.form.getFieldsValue();
    if (!name || !walletType || !network) {
      return;
    }

    const selectedNetworkConfig = walletService.getSelectedNetwork(network, props);
    if (!selectedNetworkConfig) {
      return;
    }

    const createOptions: WalletCreateOptions = {
      walletName: name,
      config: selectedNetworkConfig,
      walletType,
      addressIndex: parseInt(addressIndex, 10),
      derivationPathStandard,
    };

    try {
      const createdWallet = await new WalletCreator(createOptions).create();

      const targetWallet = createdWallet.wallet;
      if (targetWallet.walletType === LEDGER_WALLET_TYPE) {
        const device: ISignerProvider = createLedgerDevice();

        // collect cro address
        const croAddress = await device.getAddress(
          targetWallet.addressIndex,
          targetWallet.config.network.addressPrefix,
          SupportedChainName.CRYPTO_ORG,
          targetWallet.derivationPathStandard,
          false,
        );

        const croAsset = createdWallet.assets.filter(
          asset => asset.assetType === UserAssetType.TENDERMINT && asset.mainnetSymbol === 'CRO',
        )[0];
        croAsset.address = croAddress;

        // override main address
        targetWallet.address = croAddress;

        waitFlag = true;
        showEthModal();
        for (let i = 0; i < 600; i++) {
          // eslint-disable-next-line no-await-in-loop
          await delay(100); // milli seconds
          if (!waitFlag) {
            break;
          }
        }
        const ethAddress = await device.getEthAddress(
          targetWallet.addressIndex,
          derivationPathStandard,
          false,
        );
        createdWallet.assets
          .filter(asset => asset.assetType === UserAssetType.EVM)
          .forEach(asset => {
            asset.address = ethAddress;
          });

        setIsLedgerEthAppConnected(true);

        await delay(3_000);
        setIsEthModalVisible(false);

        waitFlag = true;
        showCosmosModal();
        for (let i = 0; i < 600; i++) {
          // eslint-disable-next-line no-await-in-loop
          await delay(100); // milli seconds
          if (!waitFlag) {
            break;
          }
        }

        setIsLedgerCosmosAppConnected(true);

        const cosmosHubAddress = await device.getAddress(
          targetWallet.addressIndex,
          'cosmos',
          SupportedChainName.COSMOS_HUB,
          targetWallet.derivationPathStandard,
          false,
        );

        const atomAsset = createdWallet.assets.filter(
          asset =>
            asset.assetType === UserAssetType.TENDERMINT &&
            asset.config?.tendermintNetwork?.chainName === SupportedChainName.COSMOS_HUB,
        )[0];
        atomAsset.address = cosmosHubAddress;
      }

      await walletService.saveAssets(createdWallet.assets);

      setWalletTempBackupSeed(createdWallet.wallet);
      setWallet(createdWallet.wallet);
      setCreateLoading(false);
      setIsLedgerCroAppConnected(false);
      setIsLedgerEthAppConnected(false);
      setIsLedgerCosmosAppConnected(false);
      showModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet create', e);

      setCreateLoading(false);
      setIsLedgerCroAppConnected(false);
      setIsLedgerEthAppConnected(false);
      setIsLedgerCosmosAppConnected(false);
      showErrorModal();
      return;
    }

    props.form.resetFields();
  };

  const onWalletCreateFinish = async () => {
    const { walletType } = props.form.getFieldsValue();

    if (walletType === NORMAL_WALLET_TYPE) {
      onWalletCreateFinishCore();
      return;
    }
    setIsCroModalVisible(true);
    setIsLedgerCroAppConnected(false);
  };

  const checkIsLedgerEthAppConnected = async () => {
    setCreateLoading(true);
    try {
      const device = createLedgerDevice();
      await device.getEthAddress(0, DerivationPathStandard.BIP44, false);
      setIsLedgerEthAppConnected(true);
      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      // setIsEthModalVisible(false);
      setIsLedgerModalButtonLoading(false);
    } catch (e) {
      let message = `${t('create.notification.ledger.message1')}`;
      let description = (
        <>
          {t('create.notification.ledger.description1')}
          <br /> -{' '}
          <a
            href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
            target="_blank"
            rel="noreferrer"
          >
            {t('general.errorModalPopup.ledgerTroubleshoot')}
          </a>
        </>
      );
      // if (walletType === LEDGER_WALLET_TYPE) {
      if (detectConditionsError(((e as unknown) as any).toString())) {
        message = `${t('create.notification.ledger.message2')}`;
        description = (
          <>
            {t('create.notification.ledger.description2')}
            <br /> -{' '}
            <a
              href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
              target="_blank"
              rel="noreferrer"
            >
              {t('general.errorModalPopup.ledgerTroubleshoot')}
            </a>
          </>
        );
      }
      // }
      setIsLedgerEthAppConnected(false);

      await new Promise(resolve => {
        setTimeout(resolve, 5000);
      });
      setIsEthModalVisible(false);
      setCreateLoading(false);
      setIsLedgerModalButtonLoading(false);
      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 20,
      });
    }
  };

  const checkIsLedgerCosmosAppConnected = async () => {
    setCreateLoading(true);
    try {
      const device = createLedgerDevice();
      await device.getAddress(
        0,
        'cosmos',
        SupportedChainName.COSMOS_HUB,
        DerivationPathStandard.BIP44,
        false,
      );
      setIsLedgerCosmosAppConnected(true);
      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      setIsCosmosModalVisible(false);
      setIsLedgerModalButtonLoading(false);
    } catch (e) {
      let message = `${t('create.notification.ledger.message1')}`;
      let description = (
        <>
          {t('create.notification.ledger.description1')}
          <br /> -{' '}
          <a
            href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
            target="_blank"
            rel="noreferrer"
          >
            {t('general.errorModalPopup.ledgerTroubleshoot')}
          </a>
        </>
      );
      // if (walletType === LEDGER_WALLET_TYPE) {
      if (detectConditionsError(((e as unknown) as any).toString())) {
        message = `${t('create.notification.ledger.message2')}`;
        description = (
          <>
            {t('create.notification.ledger.description2')}
            <br /> -{' '}
            <a
              href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
              target="_blank"
              rel="noreferrer"
            >
              {t('general.errorModalPopup.ledgerTroubleshoot')}
            </a>
          </>
        );
      }
      // }
      setIsLedgerCosmosAppConnected(false);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      setIsCosmosModalVisible(false);
      setCreateLoading(false);
      setIsLedgerModalButtonLoading(false);
      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 20,
      });
    }
  };

  const checkIsLedgerCroAppConnected = async () => {
    const { walletType, addressIndex, derivationPathStandard } = props.form.getFieldsValue();
    let hwok = false;
    setCreateLoading(true);
    try {
      const device = createLedgerDevice();
      // check ledger device ok
      await device.getPubKey(
        parseInt(addressIndex, 10),
        SupportedChainName.CRYPTO_ORG,
        derivationPathStandard,
        false,
      );
      setIsLedgerCroAppConnected(true);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      setIsCroModalVisible(false);
      setIsLedgerModalButtonLoading(false);
      hwok = true;
    } catch (e) {
      let message = `${t('create.notification.ledger.message1')}`;
      let description = (
        <>
          {t('create.notification.ledger.description1')}
          <br /> -{' '}
          <a
            href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
            target="_blank"
            rel="noreferrer"
          >
            {t('general.errorModalPopup.ledgerTroubleshoot')}
          </a>
        </>
      );
      if (walletType === LEDGER_WALLET_TYPE) {
        if (detectConditionsError(((e as unknown) as any).toString())) {
          message = `${t('create.notification.ledger.message2')}`;
          description = (
            <>
              {t('create.notification.ledger.description2')}
              <br /> -{' '}
              <a
                href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
                target="_blank"
                rel="noreferrer"
              >
                {t('general.errorModalPopup.ledgerTroubleshoot')}
              </a>
            </>
          );
        }
      }

      setIsLedgerCroAppConnected(false);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      setIsCroModalVisible(false);
      setCreateLoading(false);
      setIsLedgerModalButtonLoading(false);
      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 20,
      });
    }
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
    if (hwok) {
      // proceed
      onWalletCreateFinishCore();
    }
  };

  useEffect(() => {
    const fetchAddressList = async () => {
      const device: ISignerProvider = createLedgerDevice();
      const standard = props.form.getFieldValue('derivationPathStandard');
      const network = props.form.getFieldValue('network');
      switch (`${ledgerAssetType}-${ledgerChainName}`) {
        case `${UserAssetType.EVM}-${SupportedChainName.CRONOS}`:
          {
            const ethAddressList = await device.getEthAddressList(0, 10, standard);
            if (ethAddressList) {
              const returnList = ethAddressList.map((address, idx) => {
                return {
                  index: idx,
                  publicAddress: address,
                  derivationPath: LedgerSigner.getDerivationPath(
                    idx,
                    UserAssetType.EVM,
                    SupportedChainName.CRONOS,
                    standard,
                  ),
                  balance: '0',
                };
              });
              setLedgerAddressList(returnList);
            }
          }
          break;
        case `${UserAssetType.EVM}-${SupportedChainName.ETHEREUM}`:
          {
            const ethAddressList = await device.getEthAddressList(0, 10, standard);
            if (ethAddressList) {
              const returnList = ethAddressList.map((address, idx) => {
                return {
                  index: idx,
                  publicAddress: address,
                  derivationPath: LedgerSigner.getDerivationPath(
                    idx,
                    UserAssetType.EVM,
                    SupportedChainName.ETHEREUM,
                    standard,
                  ),
                  balance: '0',
                };
              });
              setLedgerAddressList(returnList);
            }
          }
          break;
        case `${UserAssetType.TENDERMINT}-${SupportedChainName.CRYPTO_ORG}`:
          {
            const addressPrefix =
              network === DefaultWalletConfigs.TestNetCroeseid4Config.name ? 'tcro' : 'cro';
            const tendermintAddressList = await device.getAddressList(
              0,
              10,
              addressPrefix,
              SupportedChainName.CRYPTO_ORG,
              standard,
            );
            if (tendermintAddressList) {
              const returnList = tendermintAddressList.map((address, idx) => {
                return {
                  index: idx,
                  publicAddress: address,
                  derivationPath: LedgerSigner.getDerivationPath(
                    idx,
                    UserAssetType.TENDERMINT,
                    SupportedChainName.CRYPTO_ORG,
                    standard,
                  ),
                  balance: '0',
                };
              });
              setLedgerAddressList(returnList);
            }
          }
          break;
        case `${UserAssetType.TENDERMINT}-${SupportedChainName.COSMOS_HUB}`:
          {
            const addressPrefix = 'cosmos';
            const cosmosHubAddressList = await device.getAddressList(
              0,
              10,
              addressPrefix,
              SupportedChainName.COSMOS_HUB,
              standard,
            );
            if (cosmosHubAddressList) {
              const returnList = cosmosHubAddressList.map((address, idx) => {
                return {
                  index: idx,
                  publicAddress: address,
                  derivationPath: LedgerSigner.getDerivationPath(
                    idx,
                    UserAssetType.TENDERMINT,
                    SupportedChainName.COSMOS_HUB,
                    standard,
                  ),
                  balance: '0',
                };
              });
              setLedgerAddressList(returnList);
            }
          }
          break;
        default:
      }
    };
    if (isLedgerConnected) {
      fetchAddressList();
    }
  }, [isLedgerConnected]);

  return (
    <Form
      {...layout}
      layout="vertical"
      form={props.form}
      name="control-ref"
      onFinish={onWalletCreateFinish}
      onChange={onChange}
      initialValues={{
        walletType: 'normal',
        addressIndex: '0',
        network: NetworkName.MAINNET,
      }}
    >
      <Form.Item
        name="name"
        label={t('create.formCreate.name.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('create.formCreate.name.label')} ${t('general.required')}`,
          },
        ]}
      >
        <Input maxLength={36} placeholder={t('create.formCreate.name.label')} />
      </Form.Item>
      <Form.Item>
        <Checkbox onChange={onCheckboxChange} checked={hwcheck}>
          {t('create.formCreate.checkbox1')}
        </Checkbox>
      </Form.Item>
      <>
        <ModalPopup
          isModalVisible={isHWModeSelected}
          handleCancel={() => setIsHWModeSelected(false)}
          handleOk={() => setIsHWModeSelected(false)}
          className=""
          footer={[]}
          okText="Confirm"
          width={1200}
          style={{ zIndex: 100 }}
        >
          <div className="title">{t('create.LedgerAddressIndexBalanceTable.title')}</div>
          <div className="description">
            {t('create.LedgerAddressIndexBalanceTable.description')}
          </div>
          <div className="item">
            <Form.Item name="assetType">
              <Select
                style={{ width: '180px', textAlign: 'center' }}
                placeholder={`${t('general.select')} ${t(
                  'create.LedgerAddressIndexBalanceTable.assetType.label',
                )}`}
                disabled={props.isWalletSelectFieldDisable}
                defaultActiveFirstOption
                onSelect={e => {
                  setRecoil(ledgerIsConnectedState, LedgerConnectedApp.NOT_CONNECTED);
                  setLedgerAddressList([]);
                  switch (e) {
                    case `${UserAssetType.TENDERMINT}-${SupportedChainName.CRYPTO_ORG}`:
                      setLedgerAssetType(UserAssetType.TENDERMINT);
                      setLedgerChainName(SupportedChainName.CRYPTO_ORG);
                      ledgerNotificationWithoutCheck(
                        UserAssetType.TENDERMINT,
                        SupportedChainName.CRYPTO_ORG,
                      );
                      break;
                    case `${UserAssetType.EVM}-${SupportedChainName.CRONOS}`:
                      setLedgerAssetType(UserAssetType.EVM);
                      setLedgerChainName(SupportedChainName.CRONOS);
                      ledgerNotificationWithoutCheck(UserAssetType.EVM);
                      break;
                    case `${UserAssetType.EVM}-${SupportedChainName.ETHEREUM}`:
                      setLedgerAssetType(UserAssetType.EVM);
                      setLedgerChainName(SupportedChainName.ETHEREUM);
                      ledgerNotificationWithoutCheck(UserAssetType.EVM);
                      break;
                    case `${UserAssetType.TENDERMINT}-${SupportedChainName.COSMOS_HUB}`:
                      setLedgerAssetType(UserAssetType.TENDERMINT);
                      setLedgerChainName(SupportedChainName.COSMOS_HUB);
                      ledgerNotificationWithoutCheck(
                        UserAssetType.TENDERMINT,
                        SupportedChainName.COSMOS_HUB,
                      );
                      break;
                    default:
                  }
                }}
              >
                <Select.Option key="crypto-org-chain" value={`${UserAssetType.TENDERMINT}-${SupportedChainName.CRYPTO_ORG}`}>
                  {SupportedChainName.CRYPTO_ORG}
                </Select.Option>
                <Select.Option key="cronos-chain" value={`${UserAssetType.EVM}-${SupportedChainName.CRONOS}`}>
                  {SupportedChainName.CRONOS}
                </Select.Option>
                <Select.Option key="ethereum-chain" value={`${UserAssetType.EVM}-${SupportedChainName.ETHEREUM}`}>
                  {SupportedChainName.ETHEREUM}
                </Select.Option>
                <Select.Option key="cosmos-hub-chain" value={`${UserAssetType.TENDERMINT}-${SupportedChainName.COSMOS_HUB}`}>
                  {SupportedChainName.COSMOS_HUB}
                </Select.Option>
              </Select>
            </Form.Item>

            {ledgerAssetType && ledgerChainName ? (
              <LedgerAddressIndexBalanceTable
                addressIndexBalanceList={ledgerAddressList}
                setAddressIndexBalanceList={setLedgerAddressList}
                setisHWModeSelected={setIsHWModeSelected}
                assetType={ledgerAssetType}
                chainName={ledgerChainName}
                form={props.form}
                setDerivationPath={setDerivationPath}
              />
            ) : (
              <></>
            )}
          </div>
        </ModalPopup>
      </>
      <div hidden={props.isWalletSelectFieldDisable}>
        {/* wallet type and ledger specific code starts here */}
        <Form.Item name="walletType" label={t('create.formCreate.walletType.label')} hidden>
          <Select
            placeholder={`${t('general.select')} ${t('create.formCreate.walletType.label')}`}
            disabled={props.isWalletSelectFieldDisable}
          >
            <Select.Option key="normal" value="normal">
              {t('general.walletType.normal')}
            </Select.Option>
            <Select.Option key="ledger" value="ledger">
              {t('general.walletType.ledger')}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="derivationPathStandard"
          label={t('create.formCreate.derivationPathStandard.label')}
        >
          <Select
            placeholder={`${t('general.select')} ${t('create.formCreate.walletType.label')}`}
            disabled={props.isWalletSelectFieldDisable}
            onChange={() => {
              setLedgerAddressList([]);
              setLedgerAssetType(undefined);
              setLedgerChainName(undefined);
              props.form.setFieldsValue({
                assetType: undefined,
              });
              setDerivationPath({
                cronosTendermint: LedgerSigner.getDerivationPath(
                  props.form.getFieldValue('addressIndex'),
                  UserAssetType.TENDERMINT,
                  SupportedChainName.CRYPTO_ORG,
                  props.form.getFieldValue('derivationPathStandard'),
                ),
                cosmosTendermint: LedgerSigner.getDerivationPath(
                  props.form.getFieldValue('addressIndex'),
                  UserAssetType.TENDERMINT,
                  SupportedChainName.COSMOS_HUB,
                  props.form.getFieldValue('derivationPathStandard'),
                ),
                evm: LedgerSigner.getDerivationPath(
                  props.form.getFieldValue('addressIndex'),
                  UserAssetType.EVM,
                  SupportedChainName.CRONOS,
                  props.form.getFieldValue('derivationPathStandard'),
                ),
              });
            }}
          >
            <Select.Option key="bip-44" value={DerivationPathStandard.BIP44}>
              BIP-44
            </Select.Option>
            <Select.Option key="ledger-live" value={DerivationPathStandard.LEDGER_LIVE}>
              Ledger Live
            </Select.Option>
          </Select>
        </Form.Item>
        <Button
          type="ghost"
          size="small"
          onClick={() => {
            setIsHWModeSelected(true);
          }}
          style={{
            border: '0',
            boxShadow: 'none',
          }}
        >
          {t('create.formCreate.showLedger.label')}
        </Button>
        <Form.Item name="derivationPath" label={t('create.formCreate.derivationPath.label')}>
          <div
            style={{
              display: 'flex',
            }}
            className="derivation-path-container"
          >
            <div>
              Crypto.org Chain
              <br />
              <Text type="secondary">{derivationPath.cronosTendermint}</Text>
            </div>
            <div>
              Cosmos Hub Chain
              <br />
              <Text type="secondary">{derivationPath.cosmosTendermint}</Text>
            </div>
            <div>
              EVM Chain
              <br />
              <Text type="secondary">{derivationPath.evm}</Text>
            </div>
          </div>
        </Form.Item>
        <Form.Item
          name="addressIndex"
          label={t('create.formCreate.index.label')}
          rules={[
            {
              required: true,
              message: `${t('create.formCreate.index.label')} ${t('general.required')}`,
            },
            {
              pattern: /^\d+$/,
              message: `${t('create.formCreate.index.label')} ${t(
                'create.formCreate.index.error',
              )}`,
            },
          ]}
        >
          <InputNumber
            value={props.form.getFieldValue('addressIndex')}
            type="number"
            onChange={() => {
              setDerivationPath({
                cronosTendermint: LedgerSigner.getDerivationPath(
                  props.form.getFieldValue('addressIndex'),
                  UserAssetType.TENDERMINT,
                  SupportedChainName.CRYPTO_ORG,
                  props.form.getFieldValue('derivationPathStandard'),
                ),
                cosmosTendermint: LedgerSigner.getDerivationPath(
                  props.form.getFieldValue('addressIndex'),
                  UserAssetType.TENDERMINT,
                  SupportedChainName.COSMOS_HUB,
                  props.form.getFieldValue('derivationPathStandard'),
                ),
                evm: LedgerSigner.getDerivationPath(
                  props.form.getFieldValue('addressIndex'),
                  UserAssetType.EVM,
                  SupportedChainName.CRONOS,
                  props.form.getFieldValue('derivationPathStandard'),
                ),
              });
            }}
            min={0}
            max={LedgerWalletMaximum}
          />
        </Form.Item>
        <Form.Item>
          <NoticeDisclaimer>{t('create.formCreate.addressIndex.disclaimer')}</NoticeDisclaimer>
        </Form.Item>
      </div>

      <Form.Item
        name="network"
        label={t('create.formCreate.network.label')}
        rules={[{ required: true }]}
      >
        <Select
          placeholder={`${t('general.select')} ${t('create.formCreate.network.label')}`}
          onChange={onNetworkChange}
          disabled={props.isNetworkSelectFieldDisable}
        >
          {walletService.supportedConfigs().map(config => (
            <Select.Option key={config.name} value={config.name} disabled={!config.enabled}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <SuccessModalPopup
          isModalVisible={isModalVisible}
          handleCancel={handleCancel}
          handleOk={handleOk}
          title={t('general.successModalPopup.title')}
          button={
            <Button
              type="primary"
              htmlType="submit"
              disabled={props.isCreateDisable}
              loading={createLoading}
            >
              {t('general.successModalPopup.createWallet.button')}
            </Button>
          }
          footer={[
            <Button key="submit" type="primary" onClick={handleOk}>
              {t('general.continue')}
            </Button>,
          ]}
        >
          <>
            <div className="description">
              {t('general.successModalPopup.createWallet.description')}
            </div>
          </>
        </SuccessModalPopup>
        <ErrorModalPopup
          isModalVisible={isErrorModalVisible}
          handleCancel={handleErrorCancel}
          handleOk={handleErrorOk}
          title={t('general.errorModalPopup.title')}
          footer={[]}
        >
          <>
            <div className="description">
              {t('general.errorModalPopup.createWallet.description')}
            </div>
            {props.form.getFieldValue('walletType') === LEDGER_WALLET_TYPE ? (
              <>
                <br />-{' '}
                <a
                  href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('general.errorModalPopup.ledgerTroubleshoot')}
                </a>
              </>
            ) : (
              <></>
            )}
          </>
        </ErrorModalPopup>
        <LedgerModalPopup
          isModalVisible={isCosmosModalVisible}
          handleCancel={handleCosmosCancel}
          handleOk={handleCosmosOk}
          title={
            isLedgerCosmosAppConnected
              ? t('create.ledgerModalPopup.tendermintAddress.title1')
              : t('create.ledgerModalPopup.tendermintAddress.title2')
          }
          footer={[
            isLedgerCosmosAppConnected ? (
              <></>
            ) : (
              <Button
                type="primary"
                size="small"
                className="btn-restart"
                onClick={() => {
                  handleCosmosOk();
                  setIsLedgerModalButtonLoading(true);
                  setTimeout(() => {
                    checkIsLedgerCosmosAppConnected();
                  }, 500);
                }}
                loading={isLedgerModalButtonLoading}
              // style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
              >
                {t('general.connect')}
              </Button>
            ),
          ]}
          image={isLedgerCosmosAppConnected ? <SuccessCheckmark /> : <IconLedger />}
        >
          <div className="description">
            {isLedgerCosmosAppConnected ? (
              t('create.ledgerModalPopup.tendermintAddress.description1')
            ) : (
              <>
                {t('create.ledgerModalPopup.tendermintAddress.description3')}
                <div className="ledger-app-icon">
                  <IconCosmos style={{ color: '#fff' }} />
                </div>
                Cosmos App
              </>
            )}
          </div>
        </LedgerModalPopup>
        <LedgerModalPopup
          isModalVisible={isCroModalVisible}
          handleCancel={handleCroCancel}
          handleOk={handleCroOk}
          title={
            isLedgerCroAppConnected
              ? t('create.ledgerModalPopup.tendermintAddress.title1')
              : t('create.ledgerModalPopup.tendermintAddress.title2')
          }
          footer={[
            isLedgerCroAppConnected ? (
              <></>
            ) : (
              <Button
                type="primary"
                size="small"
                className="btn-restart"
                onClick={() => {
                  setIsLedgerModalButtonLoading(true);
                  setTimeout(() => {
                    checkIsLedgerCroAppConnected();
                  }, 500);
                }}
                loading={isLedgerModalButtonLoading}
              // style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
              >
                {t('general.connect')}
              </Button>
            ),
          ]}
          image={isLedgerCroAppConnected ? <SuccessCheckmark /> : <IconLedger />}
        >
          <div className="description">
            {isLedgerCroAppConnected ? (
              t('create.ledgerModalPopup.tendermintAddress.description1')
            ) : (
              <>
                {t('create.ledgerModalPopup.tendermintAddress.description3')}
                <div className="ledger-app-icon">
                  <IconCro style={{ color: '#fff' }} />
                </div>
                Crypto.org App
              </>
            )}
          </div>
        </LedgerModalPopup>
        <LedgerModalPopup
          isModalVisible={isEthModalVisible}
          handleCancel={handleEthCancel}
          handleOk={handleEthOk}
          title={
            isLedgerEthAppConnected
              ? t('create.ledgerModalPopup.evmAddress.title1')
              : t('create.ledgerModalPopup.evmAddress.title2')
          }
          footer={[
            isLedgerEthAppConnected ? (
              <></>
            ) : (
              <Button
                type="primary"
                size="small"
                className="btn-restart"
                onClick={() => {
                  handleEthOk();
                  setIsLedgerModalButtonLoading(true);
                  setTimeout(() => {
                    checkIsLedgerEthAppConnected();
                  }, 500);
                }}
                loading={isLedgerModalButtonLoading}
              // style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
              >
                {t('general.connect')}
              </Button>
            ),
          ]}
          image={isLedgerEthAppConnected ? <SuccessCheckmark /> : <IconLedger />}
        >
          <div className="description">
            {isLedgerEthAppConnected ? (
              t('create.ledgerModalPopup.evmAddress.description1')
            ) : (
              <>
                {t('create.ledgerModalPopup.tendermintAddress.description3')}
                <div className="ledger-app-icon">
                  <IconEth style={{ color: '#fff' }} />
                </div>
                Ethereum App
              </>
            )}
          </div>
        </LedgerModalPopup>
      </Form.Item>
    </Form>
  );
};

const CreatePage = () => {
  const [form] = Form.useForm();
  const [isCreateDisable, setIsCreateDisable] = useState(false);
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isNetworkSelectFieldDisable, setIsNetworkSelectFieldDisable] = useState(true);
  const [isWalletSelectFieldDisable, setIsWalletSelectFieldDisable] = useState(true);
  const [networkConfig, setNetworkConfig] = useState();
  const [walletIdentifier, setWalletIdentifier] = useRecoilState(walletIdentifierState);
  const didMountRef = useRef(false);
  const history = useHistory();
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [goHomeButtonLoading, setGoHomeButtonLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet>();
  const [walletTempBackupSeed] = useRecoilState(walletTempBackupState);
  const currentSession = useRecoilValue(sessionState);

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const onWalletBackupFinish = async (password: string) => {
    setGoHomeButtonLoading(true);
    if (!wallet) {
      return;
    }
    await walletService.encryptWalletAndSetSession(password, wallet);
    setGoHomeButtonLoading(false);
    history.push('/home');
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      const fetchedWallet = walletTempBackupSeed;
      if (fetchedWallet === undefined || fetchedWallet === null) return;
      setWallet(fetchedWallet);

      if (fetchedWallet.walletType === LEDGER_WALLET_TYPE) {
        setInputPasswordVisible(true);
      } else {
        // Jump to backup screen after walletIdentifier created & setWalletIdentifier finished
        history.push({
          pathname: '/create/backup',
          state: { walletIdentifier },
        });
      }
    };

    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Create');
    } else {
      fetchWalletData();
    }
    // eslint-disable-next-line
  }, [walletIdentifier, history]);

  return (
    <main className="create-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <BackButton />
        <div>
          <div className="title">
            {!isCustomConfig || isConnected ? t('create.title1') : t('create.title2')}
          </div>
          <div className="slogan">
            {!isCustomConfig || isConnected ? t('create.slogan1') : t('create.slogan2')}
          </div>

          {!isCustomConfig || isConnected ? (
            <FormCreate
              form={form}
              isCreateDisable={isCreateDisable}
              isNetworkSelectFieldDisable={isNetworkSelectFieldDisable}
              isWalletSelectFieldDisable={isWalletSelectFieldDisable}
              setIsNetworkSelectFieldDisable={setIsNetworkSelectFieldDisable}
              setIsWalletSelectFieldDisable={setIsWalletSelectFieldDisable}
              setWalletIdentifier={setWalletIdentifier}
              setIsCustomConfig={setIsCustomConfig}
              setIsConnected={setIsConnected}
              setIsCreateDisable={setIsCreateDisable}
              networkConfig={networkConfig}
            />
          ) : (
            <FormCustomConfig
              setIsConnected={setIsConnected}
              setIsCreateDisable={setIsCreateDisable}
              setNetworkConfig={setNetworkConfig}
            />
          )}

          <PasswordFormModal
            description={t('general.passwordFormModal.createWallet.description')}
            okButtonText={t('general.passwordFormModal.createWallet.okButton')}
            isButtonLoading={goHomeButtonLoading}
            onCancel={() => {
              setInputPasswordVisible(false);
            }}
            onSuccess={onWalletBackupFinish}
            onValidatePassword={async (password: string) => {
              const isValid = await secretStoreService.checkIfPasswordIsValid(password);
              return {
                valid: isValid,
                errMsg: !isValid ? t('general.passwordFormModal.error') : '',
              };
            }}
            successText={t('general.passwordFormModal.createWallet.success')}
            title={t('general.passwordFormModal.title')}
            visible={inputPasswordVisible}
            successButtonText={t('general.passwordFormModal.createWallet.successButton')}
            confirmPassword={false}
          />
        </div>
      </div>
    </main>
  );
};

export default CreatePage;
