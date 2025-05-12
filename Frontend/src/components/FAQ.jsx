import React from 'react';
import { FaQuestionCircle, FaUserPlus, FaGift, FaShoppingCart } from 'react-icons/fa';

function FAQ() {
  return (
    <div className="mt-5 py-5">
      <h2 className="text-center mb-4">Questions fréquentes</h2>
      <div className="accordion" id="faqAccordion">
        <div className="accordion-item">
          <h2 className="accordion-header" id="faqHeading1">
            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapse1" aria-expanded="true" aria-controls="faqCollapse1">
              <FaQuestionCircle className="me-2" /> Qu'est-ce que we learn ?
            </button>
          </h2>
          <div id="faqCollapse1" className="accordion-collapse collapse show" aria-labelledby="faqHeading1" data-bs-parent="#faqAccordion">
            <div className="accordion-body">
              <p>we learn est une plateforme éducative innovante qui permet aux étudiants d'accéder à une gamme de cours diversifiés dans plusieurs domaines.</p>
              <p>Notre mission est de rendre l'apprentissage accessible à tous, partout et à tout moment, avec des contenus de qualité créés par des experts.</p>
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="faqHeading2">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapse2" aria-expanded="false" aria-controls="faqCollapse2">
              <FaUserPlus className="me-2" /> Comment m'inscrire sur la plateforme ?
            </button>
          </h2>
          <div id="faqCollapse2" className="accordion-collapse collapse" aria-labelledby="faqHeading2" data-bs-parent="#faqAccordion">
            <div className="accordion-body">
              <p>Vous pouvez vous inscrire en cliquant sur le bouton "S'inscrire" en haut de la page et en remplissant le formulaire avec les informations demandées.</p>
              <p>L'inscription est simple et rapide, et vous donne immédiatement accès à notre catalogue de cours, formations et tests.</p>
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="faqHeading3">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapse3" aria-expanded="false" aria-controls="faqCollapse3">
              <FaGift className="me-2" /> Quelles offres sont disponibles actuellement ?
            </button>
          </h2>
          <div id="faqCollapse3" className="accordion-collapse collapse" aria-labelledby="faqHeading3" data-bs-parent="#faqAccordion">
            <div className="accordion-body">
              <p>Actuellement, nous avons des offres spéciales sur certaines formations qui vous permettent d'y accéder à prix réduit.</p>
              <p>Nous proposons également des packs de cours thématiques et des abonnements mensuels pour un accès illimité à notre catalogue.</p>
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="faqHeading4">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapse4" aria-expanded="false" aria-controls="faqCollapse4">
              <FaShoppingCart className="me-2" /> Comment m'abonner à une offre ?
            </button>
          </h2>
          <div id="faqCollapse4" className="accordion-collapse collapse" aria-labelledby="faqHeading4" data-bs-parent="#faqAccordion">
            <div className="accordion-body">
              <p>Pour vous abonner à une offre, sélectionnez la formation de votre choix et suivez les étapes pour acheter l'offre ou vous inscrire au cours.</p>
              <p>Nous acceptons plusieurs méthodes de paiement sécurisées et vous pouvez accéder immédiatement à votre contenu après l'achat.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
