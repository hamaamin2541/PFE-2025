import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Star } from 'lucide-react';
import './PointsDisplay.css';

const PointsDisplay = ({ points, size = 'md', showIcon = true, showTooltip = true }) => {
  const formattedPoints = points?.toLocaleString() || '0';
  
  const getPointsClass = () => {
    if (points >= 1000) return 'points-gold';
    if (points >= 500) return 'points-silver';
    return 'points-bronze';
  };
  
  const content = (
    <Badge 
      className={`points-badge ${getPointsClass()} points-${size}`}
      pill
    >
      {showIcon && <Star size={size === 'sm' ? 12 : 16} className="me-1" />}
      {formattedPoints} pts
    </Badge>
  );
  
  if (showTooltip) {
    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id="points-tooltip">
            Vous avez accumulé <strong>{formattedPoints} points</strong>
          </Tooltip>
        }
      >
        <span>{content}</span>
      </OverlayTrigger>
    );
  }
  
  return content;
};

export default PointsDisplay;
