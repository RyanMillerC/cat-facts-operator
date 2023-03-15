import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import './example.css';
import { CatIcon } from './CatIcon';

export default function CatFactModal(props) {
  // TODO: Find a better way to check/validate that data comes in
  if (props.data.metadata === undefined) {
    return null;
  }

  const data = props.data

  const Icon = () => {
      return <CatIcon iconName={data.spec.iconName} />;
  };

  return (
    <>
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        titleIconVariant={Icon}
        variant={ModalVariant.small}
      >
        <CatIcon iconName={data.spec.iconName} />
        <h1>Cat Fact</h1>
        <h2>{data.metadata.name}</h2>
        <h4>{data.spec.fact}</h4>
      </Modal>
    </>
  );
}
