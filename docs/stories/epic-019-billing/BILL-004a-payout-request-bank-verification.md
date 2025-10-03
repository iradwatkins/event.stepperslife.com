# BILL-004a: Payout Request & Bank Verification

**Parent Story:** BILL-004 - Organizer Payout Management
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 2
**Priority:** High
**Status:** Ready for Development

## User Story

**As an** event organizer
**I want** to request payouts and verify my bank account
**So that** I can receive my event revenue safely and securely

## Acceptance Criteria

### AC1: Payout Request UI
- [ ] **Available Balance Display:**
  - Shows current available balance: "$1,250.50 available"
  - Shows pending balance: "$350.00 pending (7-day hold)"
  - Shows total earned: "$5,600.00 lifetime earnings"
  - Tooltip explains 7-day rolling reserve policy
- [ ] **Minimum Payout Validation:**
  - Minimum payout amount: $50.00
  - Error message if balance < $50: "Minimum payout is $50.00. Current balance: $45.00"
  - Disable payout button until minimum reached
- [ ] **Payout Request Form:**
  - Amount field (pre-filled with available balance, editable)
  - Partial payout option: "Request partial amount"
  - Bank account selector (dropdown of verified accounts)
  - Estimated arrival date displayed: "Arrives in 3-5 business days"
  - Confirmation checkbox: "I confirm payout details are correct"
- [ ] **Request Submission:**
  - Loading spinner during submission
  - Success message: "Payout requested! Track status in Payout History"
  - Error handling with user-friendly messages
  - Email confirmation sent to organizer

### AC2: Bank Account Management UI
- [ ] **Add Bank Account:**
  - Form fields: Bank name, Account holder name, Routing number, Account number
  - Account type selector: Checking / Savings
  - Country selector (US only for MVP)
  - Validation: Routing number (9 digits), Account number (up to 17 digits)
  - "Add Account" button triggers verification flow
- [ ] **Bank Account List:**
  - Shows all added accounts (max 3 accounts)
  - Display format: "Chase Checking •••• 4567 (Verified)"
  - Status badges: Verified (green), Pending (yellow), Failed (red)
  - Actions: Set as default, Delete (if not default)
  - Default account highlighted with star icon
- [ ] **Account Verification Status:**
  - Unverified: "Verification pending - Check your bank for micro-deposits"
  - Pending: "We sent 2 micro-deposits. Enter amounts to verify."
  - Verified: "Account verified and ready for payouts"
  - Failed: "Verification failed. Please re-add your account."

### AC3: Plaid Integration for Instant Verification
- [ ] **Plaid Link Flow:**
  - "Verify Instantly with Plaid" button launches Plaid Link modal
  - Organizer logs into their bank through Plaid
  - Plaid returns account details and verification token
  - Account automatically marked as verified
  - Fallback to manual verification if Plaid fails
- [ ] **Supported Banks:**
  - Major US banks: Chase, Bank of America, Wells Fargo, etc.
  - Credit unions supported via Plaid
  - Fallback message if bank not supported: "Manual verification available"
- [ ] **Security:**
  - Plaid access token stored securely (encrypted)
  - No storage of bank login credentials
  - Account numbers masked in UI: "•••• 4567"
  - PCI DSS compliance maintained

### AC4: Micro-deposit Verification (Fallback)
- [ ] **Micro-deposit Process:**
  - System initiates 2 small ACH deposits ($0.01 - $0.99)
  - Deposits take 1-2 business days to appear
  - Email notification when deposits sent
  - Verification form: "Enter the two deposit amounts"
- [ ] **Verification Form:**
  - Two amount input fields: Amount 1, Amount 2
  - Validation: Must be between $0.01 and $0.99
  - 3 attempts allowed before account locked
  - "Verify Account" button submits amounts
- [ ] **Verification Success/Failure:**
  - Success: Account marked as verified, can receive payouts
  - Failure: Error message, attempts remaining shown
  - Locked: "Too many failed attempts. Contact support."

### AC5: Validation & Error Handling
- [ ] **Bank Account Validation:**
  - Routing number validates against ABA database
  - Account number format checked (digits only)
  - Duplicate account prevention: "This account is already added"
  - Account holder name matches organizer name (warning if mismatch)
- [ ] **Payout Request Validation:**
  - Amount > 0 and <= available balance
  - Bank account must be verified
  - Cannot request payout with pending verification
  - Organizer must be KYC verified (identity confirmed)
- [ ] **Error Messages:**
  - User-friendly, actionable messages
  - Include support link for complex issues
  - Rate limiting: Max 5 payout requests per day

## Technical Implementation

### Frontend Components

**File:** `/components/billing/PayoutRequestForm.tsx`
```typescript
interface PayoutRequestFormProps {
  availableBalance: number;
  pendingBalance: number;
  bankAccounts: BankAccount[];
}

export function PayoutRequestForm({
  availableBalance,
  pendingBalance,
  bankAccounts,
}: PayoutRequestFormProps) {
  const [amount, setAmount] = useState(availableBalance);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verifiedAccounts = bankAccounts.filter((a) => a.status === 'verified');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (amount < 50) {
      toast.error('Minimum payout amount is $50.00');
      return;
    }

    if (!selectedAccount) {
      toast.error('Please select a bank account');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/billing/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bankAccountId: selectedAccount,
        }),
      });

      if (!response.ok) throw new Error('Payout request failed');

      toast.success('Payout requested successfully!');
      router.push('/dashboard/billing/payouts');
    } catch (error) {
      toast.error('Failed to request payout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-4">
        <BalanceCard
          label="Available"
          amount={availableBalance}
          color="green"
          tooltip="Amount ready for payout"
        />
        <BalanceCard
          label="Pending"
          amount={pendingBalance}
          color="yellow"
          tooltip="7-day rolling reserve"
        />
        <BalanceCard
          label="Total Earned"
          amount={availableBalance + pendingBalance}
          color="blue"
        />
      </div>

      {/* Payout Amount */}
      <div>
        <Label>Payout Amount</Label>
        <Input
          type="number"
          min={50}
          max={availableBalance}
          step={0.01}
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          prefix="$"
        />
        <p className="text-sm text-gray-600 mt-1">
          Minimum: $50.00 • Maximum: ${availableBalance.toFixed(2)}
        </p>
      </div>

      {/* Bank Account Selection */}
      <div>
        <Label>Bank Account</Label>
        {verifiedAccounts.length === 0 ? (
          <Alert variant="warning">
            No verified bank accounts. Please add and verify a bank account first.
          </Alert>
        ) : (
          <Select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
            <option value="">Select account...</option>
            {verifiedAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} {account.accountType} •••• {account.last4}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Estimated Arrival */}
      <Alert variant="info">
        <ClockIcon className="w-5 h-5" />
        <div>
          <p className="font-semibold">Estimated Arrival</p>
          <p className="text-sm">3-5 business days via ACH transfer</p>
        </div>
      </Alert>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || amount < 50 || !selectedAccount}
        loading={isSubmitting}
        className="w-full"
      >
        Request Payout
      </Button>
    </form>
  );
}
```

**File:** `/components/billing/BankAccountManagement.tsx`
```typescript
export function BankAccountManagement() {
  const { data: accounts, mutate } = useSWR('/api/billing/bank-accounts');
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bank Accounts</h3>
        <Button onClick={() => setShowAddForm(true)} disabled={accounts?.length >= 3}>
          <PlusIcon className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {accounts?.map((account) => (
          <BankAccountCard
            key={account.id}
            account={account}
            onDelete={() => handleDelete(account.id)}
            onSetDefault={() => handleSetDefault(account.id)}
          />
        ))}
      </div>

      {/* Add Account Modal */}
      <Modal open={showAddForm} onClose={() => setShowAddForm(false)}>
        <AddBankAccountForm onSuccess={() => {
          setShowAddForm(false);
          mutate();
        }} />
      </Modal>
    </div>
  );
}

function AddBankAccountForm({ onSuccess }: { onSuccess: () => void }) {
  const [verificationMethod, setVerificationMethod] = useState<'plaid' | 'manual'>('plaid');

  const handlePlaidVerification = async () => {
    const plaid = await initPlaidLink({
      onSuccess: async (publicToken, metadata) => {
        // Exchange public token for access token
        await fetch('/api/billing/bank-accounts/plaid', {
          method: 'POST',
          body: JSON.stringify({
            publicToken,
            accountId: metadata.accounts[0].id,
          }),
        });

        toast.success('Bank account verified successfully!');
        onSuccess();
      },
    });

    plaid.open();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Add Bank Account</h3>

      {/* Verification Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={verificationMethod === 'plaid' ? 'primary' : 'secondary'}
          onClick={() => setVerificationMethod('plaid')}
        >
          Instant Verification (Plaid)
        </Button>
        <Button
          variant={verificationMethod === 'manual' ? 'primary' : 'secondary'}
          onClick={() => setVerificationMethod('manual')}
        >
          Manual Verification
        </Button>
      </div>

      {verificationMethod === 'plaid' ? (
        <PlaidVerification onVerify={handlePlaidVerification} />
      ) : (
        <ManualBankAccountForm onSuccess={onSuccess} />
      )}
    </div>
  );
}
```

### Backend API

**File:** `/app/api/billing/payouts/request/route.ts`
```typescript
export async function POST(request: Request) {
  const session = await getServerSession();
  const organizerId = session.user.id;

  const { amount, bankAccountId } = await request.json();

  // Validate payout request
  const validation = await payoutService.validatePayoutRequest({
    organizerId,
    amount,
    bankAccountId,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Create payout request
  const payout = await payoutService.createPayoutRequest({
    organizerId,
    amount,
    bankAccountId,
    status: 'pending',
  });

  // Send confirmation email
  await emailService.sendPayoutConfirmation(session.user.email, payout);

  return NextResponse.json({ success: true, payout });
}
```

**File:** `/lib/services/payout.service.ts`
```typescript
export class PayoutService {
  async validatePayoutRequest(params: {
    organizerId: string;
    amount: number;
    bankAccountId: string;
  }): Promise<ValidationResult> {
    const { organizerId, amount, bankAccountId } = params;

    // Check minimum amount
    if (amount < 50) {
      return { valid: false, error: 'Minimum payout amount is $50.00' };
    }

    // Check available balance
    const balance = await this.getAvailableBalance(organizerId);
    if (amount > balance) {
      return { valid: false, error: 'Insufficient available balance' };
    }

    // Check bank account verified
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount || bankAccount.status !== 'verified') {
      return { valid: false, error: 'Bank account not verified' };
    }

    // Check rate limiting
    const recentPayouts = await prisma.payout.count({
      where: {
        organizerId,
        createdAt: { gte: subDays(new Date(), 1) },
      },
    });

    if (recentPayouts >= 5) {
      return { valid: false, error: 'Maximum 5 payout requests per day' };
    }

    return { valid: true };
  }

  async getAvailableBalance(organizerId: string): Promise<number> {
    // Calculate available balance (revenue - fees - 7-day hold)
    const revenueSplits = await prisma.revenueSplit.findMany({
      where: {
        organizerId,
        recordedAt: { lte: subDays(new Date(), 7) }, // 7-day rolling reserve
      },
    });

    const totalRevenue = revenueSplits.reduce(
      (sum, split) => sum + split.organizerNetRevenue,
      0
    );

    // Subtract already paid out amounts
    const payouts = await prisma.payout.findMany({
      where: { organizerId, status: { in: ['completed', 'pending'] } },
    });

    const paidOut = payouts.reduce((sum, p) => sum + p.amount, 0);

    return Math.max(0, totalRevenue - paidOut);
  }
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('PayoutService.validatePayoutRequest', () => {
  it('rejects payout below minimum ($50)', async () => {
    const result = await payoutService.validatePayoutRequest({
      organizerId: 'org_123',
      amount: 45,
      bankAccountId: 'ba_123',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Minimum payout');
  });

  it('rejects payout exceeding available balance', async () => {
    // Mock balance = $100
    const result = await payoutService.validatePayoutRequest({
      organizerId: 'org_123',
      amount: 150,
      bankAccountId: 'ba_123',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Insufficient');
  });
});
```

### E2E Tests
```typescript
test('organizer requests payout', async ({ page }) => {
  await page.goto('/dashboard/billing/payouts');

  // Verify balance displayed
  await expect(page.locator('[data-testid="available-balance"]')).toContainText('$1,250.50');

  // Click request payout
  await page.click('[data-testid="request-payout-button"]');

  // Fill form
  await page.fill('[name="amount"]', '500');
  await page.selectOption('[name="bankAccountId"]', 'ba_123');

  // Submit
  await page.click('[type="submit"]');

  // Verify success message
  await expect(page.locator('.toast-success')).toContainText('Payout requested');
});
```

## Security Considerations

- [ ] PCI DSS compliance: No storage of full account numbers
- [ ] Encrypt bank account details at rest
- [ ] Rate limiting on payout requests
- [ ] KYC verification required before first payout
- [ ] Fraud detection: Flag suspicious patterns

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Payout request UI implemented
- [ ] Bank account management functional
- [ ] Plaid integration working
- [ ] Unit tests pass (>80% coverage)
- [ ] E2E tests pass
- [ ] Security audit completed
- [ ] Code reviewed and approved