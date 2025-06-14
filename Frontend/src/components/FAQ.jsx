import React, { useState } from 'react';
import { FaQuestionCircle, FaUserPlus, FaGift, FaShoppingCart } from 'react-icons/fa';
import { Accordion } from 'react-bootstrap';
import './FAQ.css';

function FAQ() {
  const [activeKey, setActiveKey] = useState('0');

  const faqItems = [
    {
      key: '0',
      icon: <FaQuestionCircle className="me-2" />,
      question: "Qu'est-ce que we learn ?",
      answer: "we learn est une plateforme éducative innovante qui permet aux étudiants d'accéder à une gamme de cours diversifiés dans plusieurs domaines. Notre mission est de rendre l'apprentissage accessible à tous, partout et à tout moment, avec des contenus de qualité créés par des experts."
    },
    {
      key: '1',
      icon: <FaUserPlus className="me-2" />,
      question: "Comment m'inscrire sur la plateforme ?",
      answer: "Vous pouvez vous inscrire en cliquant sur le bouton \"S'inscrire\" en haut de la page et en remplissant le formulaire avec les informations demandées. L'inscription est simple et rapide, et vous donne immédiatement accès à notre catalogue de cours, formations et tests."
    },
    {
      key: '2',
      icon: <FaGift className="me-2" />,
      question: "Quelles offres sont disponibles actuellement ?",
      answer: "Actuellement, nous avons des offres spéciales sur certaines formations qui vous permettent d'y accéder à prix réduit. Nous proposons également des packs de cours thématiques et des abonnements mensuels pour un accès illimité à notre catalogue."
    },
    {
      key: '3',
      icon: <FaShoppingCart className="me-2" />,
      question: "Comment m'abonner à une offre ?",
      answer: "Pour vous abonner à une offre, sélectionnez la formation de votre choix et suivez les étapes pour acheter l'offre ou vous inscrire au cours."
    }
  ];

  return (
    <div className="mt-5 py-5">
      <h2 className="text-center mb-4">Questions fréquentes</h2>
      <Accordion onSelect={(key) => setActiveKey(key)} flush>
        {faqItems.map((item) => (
          <Accordion.Item key={item.key} eventKey={item.key}>
            <Accordion.Header>
              {item.icon} {item.question}
            </Accordion.Header>
            <Accordion.Body>
              <p>{item.answer}</p>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}

export default FAQ;
