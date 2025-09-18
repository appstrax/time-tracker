import { Model } from '@appstrax/services/shared/models/model';

export class Project extends Model {
  name: string = '';
  description: string = '';
  logoUrl: string = '';

  // Project Toggles
  ticketManagement: boolean = false;
  repoManagement: boolean = false;
  billingManagement: boolean = false;
  userManagement: boolean = false;
  documentationManagement: boolean = false;
  complianceManagement: boolean = false;
  devOpsManagement: boolean = false;
  guardrailsManagement: boolean = false;
  qualityManagement: boolean = false;
  auditManagement: boolean = false;
  projectStateManagement: boolean = false;
  statsManagement: boolean = false;
}