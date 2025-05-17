import React from 'react';
import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Award, Book, CheckCircle, CheckSquare, Calendar, CalendarCheck, Flame, GraduationCap } from 'lucide-react';
import './BadgeItem.css';

const BadgeItem = ({ badge, size = 'md', showTooltip = true }) => {
  // Map badge icon names to Lucide React components
  const getIconComponent = (iconName) => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 24 : 32;

    switch (iconName) {
      case 'award':
        return <Award size={iconSize} />;
      case 'book':
        return <Book size={iconSize} />;
      case 'check-circle':
        return <CheckCircle size={iconSize} />;
      case 'check-square':
        return <CheckSquare size={iconSize} />;
      case 'calendar':
        return <Calendar size={iconSize} />;
      case 'calendar-check':
        return <CalendarCheck size={iconSize} />;
      case 'fire':
        return <Flame size={iconSize} />;
      case 'graduation-cap':
        return <GraduationCap size={iconSize} />;
      default:
        return <Award size={iconSize} />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const badgeContent = (
    <div className={`badge-item badge-${size}`}>
      <div className="badge-icon">
        {getIconComponent(badge.icon)}
      </div>
      {size !== 'sm' && (
        <div className="badge-info">
          <div className="badge-name">{badge.name}</div>
          {size === 'lg' && (
            <div className="badge-date">
              Obtenu le {formatDate(badge.earnedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return showTooltip ? (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip id={`tooltip-${badge.badgeId}`}>
          <strong>{badge.name}</strong>
          <div>{badge.description}</div>
          {badge.earnedAt && (
            <div className="small mt-1">
              Obtenu le {formatDate(badge.earnedAt)}
            </div>
          )}
        </Tooltip>
      }
    >
      {size === 'lg' ? (
        <Card className="badge-card">
          {badgeContent}
        </Card>
      ) : (
        <div style={{ cursor: 'pointer' }}>
          {badgeContent}
        </div>
      )}
    </OverlayTrigger>
  ) : (
    size === 'lg' ? (
      <Card className="badge-card">
        {badgeContent}
      </Card>
    ) : (
      <div>
        {badgeContent}
      </div>
    )
  );
};

export default BadgeItem;
