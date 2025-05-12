import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// الترجمة لكل لغة
const resources = {
  en: {
    translation: {
      accueil: "Home",
      explore: "Explore",
      contact: "Contact",
      close: "Close",
      Enseignants:"Teachers",
      Notre_Contenu:"Our Content",
      MonCompte:"account" ,
      connexion :  "login",
      inscription : "register",
      deconnexion: "logout",
      
      Fermer:"close"
      

    }
  },
  fr: {
    translation: {
      accueil: "Accueil",
      explore: "Explorer",
      contact: "Contact",
      register: "Inscription",
      login: "Connexion",
      close: "Fermer",
      Teachers:"Enseignants",
      Our_Content:"Notre Contenu",
      monCompte: "MonCompte",
      connexion :  "Connexion",
      inscription : "Inscription",
      deconnexion: "déconnexion",
     
      Fermer:"Fermer"
      
    }
  },
  ar: {
    translation: {
      accueil: "الرئيسية",
      explore: "استكشف",
      cours: "الدورات",
      contact: "اتصل بنا",
      register: "تسجيل",
      login: "تسجيل الدخول",
      close: "إغلاق",
      Teachers:"المعلمون",
      Course_Offer:"عرض الدورات",
      Our_Content:"محتوانا"
      
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
