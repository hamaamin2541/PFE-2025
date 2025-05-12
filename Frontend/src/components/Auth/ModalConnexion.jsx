// src/components/Auth/ModalConnexion.jsx
import React from 'react';
import { Modal } from "react-bootstrap";
import SeConnecter from './SeConnecter';

function ModalConnexion({ show, handleClose }) {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Se connecter</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <SeConnecter onCloseModal={handleClose} />
      </Modal.Body>
    </Modal>
  );
}

export default ModalConnexion;
