import React from 'react';

export const DocsifySidebar = ({ navigation, currentPath }) => {
  const renderNavItem = item => {
    const isActive = currentPath === item.path;

    if (item.type === 'section') {
      return (
        <li key={item.title}>
          <p className="sidebar-heading">{item.title}</p>
          {item.children && item.children.length > 0 && (
            <ul className="sidebar-links">{item.children.map(child => renderNavItem(child))}</ul>
          )}
        </li>
      );
    } else if (item.type === 'page') {
      return (
        <li key={item.title}>
          <a href={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
            {item.title}
          </a>
        </li>
      );
    } else if (item.type === 'link') {
      return (
        <li key={item.title}>
          <a
            href={item.path}
            className="sidebar-link"
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
          >
            {item.title}
            {item.external && <span className="external-link-icon">↗</span>}
          </a>
        </li>
      );
    }

    return null;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        <ul>{navigation.map(item => renderNavItem(item))}</ul>
      </div>
    </aside>
  );
};
