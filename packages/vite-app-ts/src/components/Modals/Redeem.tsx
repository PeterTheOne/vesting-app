import { useCallback, useEffect, useState } from 'react';
import { IconCross, Button, Field } from '@1hive/1hive-ui';
import { ModalHeader, Row } from './index.styled';
import { ethers } from 'ethers';
import { useIsMounted } from '../../hooks';
import { useEthersContext } from 'eth-hooks/context';
import { useAppContracts } from '~~/config/contractContext';
import { RedeemType } from '.';

export const Redeem = ({ vestedAdress, closeModal, address }: RedeemType) => {
  const isMounted = useIsMounted();
  const [redeemableAmount, setRedeemableAmount] = useState('');

  const ethersContext = useEthersContext();
  const vestedERC20 = useAppContracts('VestedERC20', ethersContext.chainId);

  console.log('vestedAdress', vestedAdress);
  useEffect(() => {
    const loadAmount = async () => {
      if (vestedERC20) {
        const value = await vestedERC20.attach(vestedAdress).getRedeemableAmount(address);
        if (isMounted()) setRedeemableAmount(ethers.utils.formatEther(value));
      }
    };
    void loadAmount();
  }, [address, isMounted, vestedERC20, vestedAdress]);

  const handleReddem = useCallback(async () => {
    if (vestedERC20) {
      const result = await vestedERC20.attach(vestedAdress).redeem(address);
      if (result?.wait) {
        const rc = await result.wait();
        if (rc?.events) {
          const event = rc.events.find((event: ethers.Event) => event.event === 'Redeem');
          if (event?.args) {
            // event Redeem(address indexed holder, address indexed recipient, uint256 redeemedAmount);
            const [_holder, _recipient, redeemedAmount] = event.args;
            console.log('Redeem::redeemedAmount', ethers.utils.formatEther(redeemedAmount));
          }
        } else {
          console.log('No Transfer and Redeem event emitted');
        }
      }
    }
  }, [address, vestedERC20, vestedAdress]);

  return (
    <div>
      <ModalHeader>
        <h1>Redeem vested tokens</h1>
        <IconCross onClick={closeModal} />
      </ModalHeader>

      <Field label={'Redeemable amount'} required={false}>
        {redeemableAmount}
      </Field>

      <Row>
        <Button onClick={handleReddem}>Claim</Button>
      </Row>
    </div>
  );
};
