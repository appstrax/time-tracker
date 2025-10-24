import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface BillingHistory {
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  displayName: string;
  details: string;
  isPrimary: boolean;
}

interface UsageData {
  teamMembers: { current: number; limit: number };
  projects: { current: number; limit: number | null };
  storage: { current: string; limit: string };
}

@Component({
  selector: 'app-billing',
  templateUrl: './billing.page.html',
  styleUrls: ['./billing.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class BillingPage {
  currentPlan = {
    name: 'Professional Plan',
    description: 'Perfect for growing teams',
    price: 49,
    status: 'Active'
  };

  usageData: UsageData = {
    teamMembers: { current: 12, limit: 25 },
    projects: { current: 8, limit: null },
    storage: { current: '2.4 GB', limit: '100 GB' }
  };

  paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      displayName: '•••• •••• •••• 4242',
      details: 'Expires 12/25',
      isPrimary: true
    },
    {
      id: '2',
      type: 'paypal',
      displayName: 'PayPal Account',
      details: 'john@example.com',
      isPrimary: false
    }
  ];

  billingHistory: BillingHistory[] = [
    { date: 'Oct 1, 2024', description: 'Professional Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Sep 1, 2024', description: 'Professional Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Aug 1, 2024', description: 'Professional Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Jul 1, 2024', description: 'Professional Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Jun 1, 2024', description: 'Starter Plan - Monthly', amount: '$19.00', status: 'Paid' }
  ];

  billingInfo = {
    companyName: 'Acme Corporation',
    billingEmail: 'billing@acme.com',
    taxId: '123-456-789'
  };

  billingAddress = {
    street: '123 Business St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'United States'
  };

  constructor() {}

  onUpgradePlan(): void {
    // Placeholder for upgrade plan functionality
    console.log('Upgrade plan clicked');
  }

  onAddPaymentMethod(): void {
    // Placeholder for add payment method functionality
    console.log('Add payment method clicked');
  }

  onEditPaymentMethod(paymentMethodId: string): void {
    // Placeholder for edit payment method functionality
    console.log('Edit payment method:', paymentMethodId);
  }

  onRemovePaymentMethod(paymentMethodId: string): void {
    // Placeholder for remove payment method functionality
    console.log('Remove payment method:', paymentMethodId);
  }

  onSetPrimaryPaymentMethod(paymentMethodId: string): void {
    // Placeholder for set primary payment method functionality
    console.log('Set primary payment method:', paymentMethodId);
  }

  onDownloadInvoice(date: string): void {
    // Placeholder for download invoice functionality
    console.log('Download invoice for:', date);
  }

  onDownloadAllInvoices(): void {
    // Placeholder for download all invoices functionality
    console.log('Download all invoices clicked');
  }

  onEditBillingInfo(): void {
    // Placeholder for edit billing info functionality
    console.log('Edit billing info clicked');
  }

  onEditBillingAddress(): void {
    // Placeholder for edit billing address functionality
    console.log('Edit billing address clicked');
  }

  getUsagePercentage(current: number, limit: number | null): number {
    if (limit === null) return 25; // Default percentage for unlimited
    return Math.round((current / limit) * 100);
  }

  getStoragePercentage(): number {
    // Simple calculation for demo - in real app would parse the values properly
    return 2.4; // 2.4GB out of 100GB
  }
} 