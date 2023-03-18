import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { CatIcon } from './CatIcon';
import { CatFact } from '../data/model';

interface CatFactModalProps {
  data: CatFact;
  isOpen: boolean;
  onClose: any; // TODO: This is a function, not sure how to tell TS that
}

export const CatFactModal: React.FC<CatFactModalProps> = (props) => {
  if (props.data === undefined) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        variant={ModalVariant.small}
      >
        <CatIcon iconName={props.data.spec.iconName} />
        <h1>Cat Fact</h1>
        <h2>{props.data.metadata.name}</h2>
        <h4>{props.data.spec.fact}</h4>
      </Modal>
    </>
  );
};
