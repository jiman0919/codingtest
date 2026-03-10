import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Help.css';

const Help = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const hiddenPaths = [ '/manual'];
  const isHidden = hiddenPaths.some(path => currentPath.startsWith(path));

  if (isHidden) {
    return null;
  }

  let manualPath = null;

  if (currentPath.startsWith('/master')) {
    manualPath = '/manual/admin_manual';
  } else if (currentPath.startsWith('/admin')) {
    manualPath = '/manual/professor_manual';
  } else if (currentPath.startsWith('/user')) {
    manualPath = '/manual/student_manual';
  } else if (currentPath.startsWith('/login')) {
    manualPath = '/manual/common_manual';
  }

  if (!manualPath) {
    return null;
  }

  return (
    <Link to={manualPath} className="help-fab" title="도움말 보기" target="_blank" rel="noopener noreferrer">
      ?
    </Link>
  );
};

export default Help; 