export interface CloudflareAccessCert {
  kid: string;
  cert: string;
}

export interface CloudflareAccessCerts {
  public_certs?: CloudflareAccessCert[];
}
