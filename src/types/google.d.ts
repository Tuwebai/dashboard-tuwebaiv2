// Declaraciones de tipos para Google Identity Services (GSI)

declare global {
  interface Window {
    gapi: any;
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback?: (response: any) => void;
          }) => {
            callback: (response: any) => void;
            requestAccessToken: () => void;
          };
          revoke: (token: string) => void;
        };
      };
    };
  }
}

export {};
