import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaGooglePlay,
  FaTwitter,
  FaLinkedinIn,
  FaPinterestP,
} from "react-icons/fa";
import { Carousel } from "react-bootstrap";
import "./SocialCardsCarousel.css";

const socialMedia = [
  { icon: <FaFacebookF size={24} />, name: "Facebook", color: "#3b5998" },
  { icon: <FaInstagram size={24} />, name: "Instagram", color: "#e4405f" },
  { icon: <FaYoutube size={24} />, name: "YouTube", color: "#ff0000" },
  { icon: <FaTiktok size={24} />, name: "TikTok", color: "#000000" },
  { icon: <FaTwitter size={24} />, name: "Twitter", color: "#1da1f2" },
  { icon: <FaLinkedinIn size={24} />, name: "LinkedIn", color: "#0077b5" },
  { icon: <FaPinterestP size={24} />, name: "Pinterest", color: "#bd081c" },
  { icon: <FaGooglePlay size={24} />, name: "Play Store", color: "#4285f4" },
];

const splitIntoChunks = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const SocialCardsCarousel = () => {
  const slides = splitIntoChunks(socialMedia, 4);

  return (
    <div className="mt-5">
      <h5 className="text-center mb-4">Suivez-nous sur les réseaux sociaux</h5>
      <Carousel controls indicators interval={4000} pause="hover">
        {slides.map((group, index) => (
          <Carousel.Item key={index}>
            <div className="d-flex justify-content-center gap-4">
              {group.map((item, idx) => (
                <div key={idx} className="social-card p-3 text-center">
                  <div className="social-icon-wrapper">
                    {item.icon}
                  </div>
                  <div className="social-name">{item.name}</div>
                </div>
              ))}
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default SocialCardsCarousel;
