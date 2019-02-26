import React from 'react';
import { Button } from 'react-bootstrap';

export default function RefreshTokenButton() {
  return <Button>
    <span className={classes('fa', 'fa-fw', 'fa-refresh')}></span>
      Refresh OAuth Token
  </Button>
};