# MKT-008: Contact List Management

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** manage my contact lists and segment my audience
**So that** I can send targeted communications to the right people

---

## Acceptance Criteria

### Contact List Creation
- [ ] Organizer can create new contact list from dashboard
- [ ] Organizer can name and describe list purpose
- [ ] System generates unique list ID
- [ ] Organizer can set list as public or private
- [ ] System displays contact count per list
- [ ] Organizer can create unlimited lists
- [ ] System prevents duplicate list names within organization

### Manual Contact Management
- [ ] Organizer can manually add contacts to list
- [ ] Organizer can add contacts by email address
- [ ] System validates email format before adding
- [ ] Organizer can add multiple contacts at once (comma-separated)
- [ ] Organizer can edit contact details (name, email, custom fields)
- [ ] Organizer can remove individual contacts from list
- [ ] System prevents duplicate contacts within same list

### CSV Import
- [ ] Organizer can upload CSV file to import contacts
- [ ] System accepts CSV with columns: Email, First Name, Last Name, Phone, Custom Fields
- [ ] System validates CSV format and displays errors
- [ ] System shows import preview before confirming
- [ ] Organizer can map CSV columns to contact fields
- [ ] System handles duplicate contacts (skip or update)
- [ ] System displays import summary (added, updated, errors)
- [ ] System limits import to 10,000 contacts per file

### Contact Segmentation
- [ ] Organizer can create segments based on filters
- [ ] Filter options: Event attended, Ticket type purchased, Purchase date, Total spent, Location, Tags
- [ ] System supports AND/OR logic for multiple filters
- [ ] Organizer can save segments for reuse
- [ ] System shows estimated segment size
- [ ] Organizer can combine multiple segments
- [ ] System updates dynamic segments automatically

### Tagging System
- [ ] Organizer can create custom tags
- [ ] Organizer can apply multiple tags to contacts
- [ ] System displays tag list with contact counts
- [ ] Organizer can filter contacts by tags
- [ ] Organizer can bulk add/remove tags
- [ ] System suggests tags based on contact activity
- [ ] Tags support color coding for visual organization

### Custom Fields
- [ ] Organizer can create custom contact fields
- [ ] Field types: Text, Number, Date, Dropdown, Boolean
- [ ] Custom fields available as merge tags in emails
- [ ] Organizer can import custom fields via CSV
- [ ] System validates custom field data types
- [ ] Organizer can make fields required or optional
- [ ] Custom fields appear in contact detail view

### List Hygiene
- [ ] System automatically identifies invalid email addresses
- [ ] System detects duplicate contacts across lists
- [ ] Organizer can merge duplicate contact records
- [ ] System flags inactive contacts (no engagement in 6+ months)
- [ ] Organizer can remove hard-bounced emails
- [ ] System provides list health score
- [ ] Organizer can archive old contacts

### Suppression List
- [ ] System maintains organization-wide suppression list
- [ ] Contacts can be added to suppression list manually
- [ ] System auto-adds unsubscribes to suppression list
- [ ] System prevents sending emails to suppressed contacts
- [ ] Organizer can view suppression list
- [ ] Organizer can remove contacts from suppression (with confirmation)
- [ ] System logs suppression history

### Contact Detail View
- [ ] Organizer can view individual contact profile
- [ ] Profile displays: Contact info, Tags, Lists, Event history, Email engagement
- [ ] Organizer can see contact's purchase history
- [ ] Profile shows recent email interactions (opens, clicks)
- [ ] Organizer can add notes to contact
- [ ] Organizer can manually unsubscribe contact
- [ ] Profile displays contact's lifetime value

### Export Functionality
- [ ] Organizer can export contact list to CSV
- [ ] Export includes all contact fields and custom fields
- [ ] Organizer can select which fields to export
- [ ] System generates download link for large exports
- [ ] Organizer can export entire list or filtered segment
- [ ] Export respects data privacy settings

---

## Technical Requirements

### Contact Management Service
```typescript
// Contact Models
interface Contact {
  id: string;
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Preferences
  emailOptIn: boolean;
  smsOptIn: boolean;

  // Custom Fields
  customFields: Record<string, any>;

  // Metadata
  source: 'MANUAL' | 'IMPORT' | 'EVENT_PURCHASE' | 'REGISTRATION' | 'API';
  tags: string[];
  lists: string[]; // List IDs

  // Engagement
  lastEmailOpenedAt?: Date;
  lastEmailClickedAt?: Date;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;

  // Activity
  totalEventsAttended: number;
  totalSpent: number; // In cents
  lastPurchaseAt?: Date;

  // Status
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'SUPPRESSED';
  unsubscribedAt?: Date;
  suppressionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface ContactList {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isPublic: boolean;

  // Type
  type: 'STATIC' | 'DYNAMIC'; // Static or segment

  // Segment (for dynamic lists)
  segmentRules?: SegmentRules;

  // Stats
  totalContacts: number;

  createdAt: Date;
  updatedAt: Date;
}

interface SegmentRules {
  conditions: SegmentCondition[];
  logic: 'AND' | 'OR';
}

interface SegmentCondition {
  field: string; // e.g., 'totalEventsAttended', 'lastPurchaseAt'
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN';
  value: any;
}

// Contact Service
export class ContactService {
  async createContact(
    organizationId: string,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      customFields?: Record<string, any>;
      source?: string;
    }
  ): Promise<Contact> {
    // Check if contact exists
    const existing = await prisma.contact.findFirst({
      where: {
        organizationId,
        email: data.email.toLowerCase(),
      },
    });

    if (existing) {
      // Update existing contact
      return await this.updateContact(existing.id, data);
    }

    // Create new contact
    return await prisma.contact.create({
      data: {
        organizationId,
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        customFields: data.customFields || {},
        source: data.source || 'MANUAL',
        emailOptIn: true,
        smsOptIn: false,
        status: 'ACTIVE',
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0,
        totalEventsAttended: 0,
        totalSpent: 0,
      },
    });
  }

  async importContactsFromCSV(
    organizationId: string,
    listId: string,
    csvFile: File
  ): Promise<ImportResult> {
    const contacts = await this.parseCSV(csvFile);
    const results = {
      added: 0,
      updated: 0,
      errors: [],
      duplicates: 0,
    };

    for (const row of contacts) {
      try {
        // Validate email
        if (!this.isValidEmail(row.email)) {
          results.errors.push({ row, error: 'Invalid email' });
          continue;
        }

        // Create or update contact
        const contact = await this.createContact(organizationId, {
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          customFields: row.customFields,
          source: 'IMPORT',
        });

        // Add to list
        await this.addContactToList(contact.id, listId);

        if (contact.createdAt === contact.updatedAt) {
          results.added++;
        } else {
          results.updated++;
        }
      } catch (error) {
        results.errors.push({ row, error: error.message });
      }
    }

    return results;
  }

  async createSegment(
    organizationId: string,
    name: string,
    rules: SegmentRules
  ): Promise<ContactList> {
    return await prisma.contactList.create({
      data: {
        organizationId,
        name,
        type: 'DYNAMIC',
        segmentRules: rules,
        isPublic: false,
        totalContacts: 0, // Will be calculated
      },
    });
  }

  async getSegmentContacts(listId: string): Promise<Contact[]> {
    const list = await prisma.contactList.findUnique({
      where: { id: listId },
    });

    if (list.type !== 'DYNAMIC') {
      // Static list
      return await prisma.contact.findMany({
        where: {
          lists: { has: listId },
          status: 'ACTIVE',
        },
      });
    }

    // Build dynamic segment query
    const query = this.buildSegmentQuery(list.segmentRules);

    return await prisma.contact.findMany({
      where: {
        organizationId: list.organizationId,
        status: 'ACTIVE',
        ...query,
      },
    });
  }

  private buildSegmentQuery(rules: SegmentRules): any {
    const conditions = rules.conditions.map(condition => {
      return this.buildCondition(condition);
    });

    if (rules.logic === 'AND') {
      return { AND: conditions };
    } else {
      return { OR: conditions };
    }
  }

  private buildCondition(condition: SegmentCondition): any {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'EQUALS':
        return { [field]: value };
      case 'NOT_EQUALS':
        return { [field]: { not: value } };
      case 'GREATER_THAN':
        return { [field]: { gt: value } };
      case 'LESS_THAN':
        return { [field]: { lt: value } };
      case 'CONTAINS':
        return { [field]: { contains: value } };
      case 'IN':
        return { [field]: { in: value } };
      default:
        return {};
    }
  }

  async addContactToList(
    contactId: string,
    listId: string
  ): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        lists: {
          push: listId,
        },
      },
    });

    // Update list count
    await this.updateListCount(listId);
  }

  async removeContactFromList(
    contactId: string,
    listId: string
  ): Promise<void> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        lists: contact.lists.filter(id => id !== listId),
      },
    });

    await this.updateListCount(listId);
  }

  async addToSuppressionList(
    organizationId: string,
    email: string,
    reason: string
  ): Promise<void> {
    await prisma.suppressionList.upsert({
      where: {
        organizationId_email: {
          organizationId,
          email: email.toLowerCase(),
        },
      },
      update: {
        reason,
        suppressedAt: new Date(),
      },
      create: {
        organizationId,
        email: email.toLowerCase(),
        reason,
        suppressedAt: new Date(),
      },
    });

    // Update contact status
    await prisma.contact.updateMany({
      where: {
        organizationId,
        email: email.toLowerCase(),
      },
      data: {
        status: 'SUPPRESSED',
        suppressionReason: reason,
      },
    });
  }

  async exportListToCSV(listId: string): Promise<string> {
    const contacts = await this.getSegmentContacts(listId);

    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Phone',
      'Tags',
      'Total Spent',
      'Events Attended',
      'Created At',
    ];

    const rows = contacts.map(contact => [
      contact.email,
      contact.firstName || '',
      contact.lastName || '',
      contact.phone || '',
      contact.tags.join(', '),
      `$${contact.totalSpent / 100}`,
      contact.totalEventsAttended,
      contact.createdAt.toISOString(),
    ]);

    return this.generateCSV(headers, rows);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async parseCSV(file: File): Promise<any[]> {
    // Use CSV parser library (e.g., papaparse)
    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data;
  }

  private generateCSV(headers: string[], rows: any[][]): string {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}
```

---

## Database Schema

```prisma
model Contact {
  id                  String   @id @default(cuid())
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])

  email               String
  firstName           String?
  lastName            String?
  phone               String?

  emailOptIn          Boolean  @default(true)
  smsOptIn            Boolean  @default(false)

  customFields        Json     @default("{}")
  source              ContactSource @default(MANUAL)
  tags                String[]
  lists               String[] // Array of list IDs

  // Engagement
  lastEmailOpenedAt   DateTime?
  lastEmailClickedAt  DateTime?
  totalEmailsSent     Int      @default(0)
  totalEmailsOpened   Int      @default(0)
  totalEmailsClicked  Int      @default(0)

  // Activity
  totalEventsAttended Int      @default(0)
  totalSpent          Int      @default(0)
  lastPurchaseAt      DateTime?

  // Status
  status              ContactStatus @default(ACTIVE)
  unsubscribedAt      DateTime?
  suppressionReason   String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([email])
  @@index([status])
}

model ContactList {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  name              String
  description       String?
  isPublic          Boolean  @default(false)

  type              ListType @default(STATIC)
  segmentRules      Json?    // SegmentRules for dynamic lists

  totalContacts     Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}

model SuppressionList {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  email             String
  reason            String
  suppressedAt      DateTime @default(now())

  @@unique([organizationId, email])
  @@index([email])
}

model ContactTag {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  name              String
  color             String?  // Hex color code
  contactCount      Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}

enum ContactSource {
  MANUAL
  IMPORT
  EVENT_PURCHASE
  REGISTRATION
  API
}

enum ContactStatus {
  ACTIVE
  UNSUBSCRIBED
  BOUNCED
  SUPPRESSED
}

enum ListType {
  STATIC
  DYNAMIC
}
```

---

## API Endpoints

```typescript
// Contacts
POST   /api/contacts                  // Create contact
GET    /api/contacts                  // List contacts
GET    /api/contacts/:id              // Get contact details
PUT    /api/contacts/:id              // Update contact
DELETE /api/contacts/:id              // Delete contact
POST   /api/contacts/import           // Import from CSV
GET    /api/contacts/export           // Export to CSV

// Lists
POST   /api/lists                     // Create list
GET    /api/lists                     // List all lists
GET    /api/lists/:id                 // Get list details
PUT    /api/lists/:id                 // Update list
DELETE /api/lists/:id                 // Delete list
GET    /api/lists/:id/contacts        // Get list contacts
POST   /api/lists/:id/contacts        // Add contact to list
DELETE /api/lists/:id/contacts/:contactId // Remove from list

// Segments
POST   /api/segments                  // Create segment
GET    /api/segments/:id/preview      // Preview segment results

// Tags
POST   /api/tags                      // Create tag
GET    /api/tags                      // List tags
PUT    /api/tags/:id                  // Update tag
DELETE /api/tags/:id                  // Delete tag
POST   /api/contacts/:id/tags         // Add tags to contact
DELETE /api/contacts/:id/tags/:tagId  // Remove tag from contact

// Suppression
POST   /api/suppression               // Add to suppression list
GET    /api/suppression               // List suppressed contacts
DELETE /api/suppression/:id           // Remove from suppression
```

---

## UI/UX Requirements

### Contact List View
1. **List Table**
   - Columns: Email, Name, Tags, Lists, Events Attended, Last Activity
   - Sortable columns
   - Bulk selection checkboxes
   - Search bar
   - Filter dropdowns (status, tags, lists)

2. **Bulk Actions**
   - Add to list
   - Add tags
   - Remove from list
   - Export selected
   - Delete selected

3. **Create Contact Button**
   - Primary CTA
   - Opens modal with contact form

### Contact Import Interface
1. **Upload CSV**
   - Drag-and-drop area
   - File size limit warning
   - Sample CSV download link

2. **Column Mapping**
   - Table showing CSV columns
   - Dropdown to map to contact fields
   - Preview first 5 rows

3. **Import Summary**
   - Success count (green)
   - Error count (red)
   - Download error log button

### Segment Builder
1. **Visual Rule Builder**
   - Add condition button
   - Condition rows: Field → Operator → Value
   - AND/OR toggle
   - Preview results button
   - Estimated contact count

2. **Save Segment**
   - Segment name input
   - Save as list button

### Contact Detail Page
1. **Header**
   - Contact name and email
   - Status badge
   - Edit button, Delete button

2. **Tabs**
   - Overview: Basic info, tags, lists
   - Activity: Email engagement, event history
   - Orders: Purchase history
   - Notes: Internal notes

---

## CSV Import Format

### Required Columns
- Email (required)

### Optional Columns
- First Name
- Last Name
- Phone
- Tags (comma-separated)
- Any custom field names

### Example CSV
```csv
Email,First Name,Last Name,Phone,Tags
john@example.com,John,Doe,555-1234,"vip,member"
jane@example.com,Jane,Smith,555-5678,"new,member"
```

---

## Testing Requirements

### Unit Tests
- Email validation
- CSV parsing and validation
- Segment query building
- Duplicate contact detection
- Suppression list enforcement

### Integration Tests
- Contact creation and updates
- CSV import with various formats
- Segment filtering accuracy
- List management operations
- Export functionality

### E2E Tests
- Upload CSV and import contacts
- Create dynamic segment and verify results
- Add contacts to multiple lists
- Export list and verify CSV format

---

## Dependencies
- **Requires:** User authentication, Organization management
- **Integrates With:** Email campaigns (MKT-001), SMS (MKT-002), Workflows (MKT-007)
- **Blocks:** Email campaign sending, SMS campaigns

---

## Notes
- Consider GDPR/CCPA data retention policies
- Implement double opt-in for email subscriptions
- Add contact deduplication across organizations
- Future: Add contact scoring based on engagement
- Future: Implement predictive segments using ML
- Store suppression list separately for compliance