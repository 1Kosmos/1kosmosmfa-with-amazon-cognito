/**
 * Copyright (c) 2018, 1Kosmos Inc. All rights reserved.
 * Licensed under 1Kosmos Open Source Public License version 1.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of this license at
 *    https://github.com/1Kosmos/1Kosmos_License/blob/main/LICENSE.txt
 */
exports.handler = async (event) => {
  console.log(event);

  event.response.publicChallengeParameters = {
    tenant: "", //ONEK_TENANT,
    community: "", //ONEK_COMMUNITY,
    kosmos_clientId: "", //ONEK_OIDC_CLIENTID,
    acr: "", //ONEK_ACR,
    state: "", //ONEK_STATE,
  };

  console.log(event);
  return event;
};
