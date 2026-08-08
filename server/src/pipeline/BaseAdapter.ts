export interface StandardizedScheme {
  source_id: string;
  source_provider: string;
  scheme_name: string;
  category: string;
  level: string;
  state_applicability: string[];
  eligibility_rules: any;
  benefits: string[];
  required_documents: string[];
  application_steps: string[];
  official_link: string;
  summary_text?: string;
  tags: string[];
  department?: string;
}

export abstract class BaseAdapter {
  protected providerName: string;

  constructor(providerName: string) {
    this.providerName = providerName;
  }

  getProviderName(): string {
    return this.providerName;
  }

  /**
   * Fetches data from the provider.
   * Can be implemented to hit a REST API, parse XML, or read a curated JSON.
   */
  abstract fetchAll(): Promise<any[]>;

  /**
   * Normalizes the provider's raw data format into our standard format.
   */
  abstract normalize(rawData: any): StandardizedScheme;
}
