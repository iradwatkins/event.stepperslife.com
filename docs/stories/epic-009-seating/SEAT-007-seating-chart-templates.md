# Story: SEAT-007 - Seating Chart Templates

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 5
**Priority**: E2 (Medium)
**Status**: Draft
**Dependencies**: SEAT-001 (Seating Chart Creator)

---

## Story

**As an** event organizer
**I want to** use pre-built seating chart templates for common venue types
**So that** I can quickly create professional seating layouts without building from scratch

---

## Acceptance Criteria

1. GIVEN I'm creating a new seated event
   WHEN I access the seating chart creator
   THEN I should see:
   - Template library with preview thumbnails
   - Common venue types (theater, arena, classroom, banquet, outdoor)
   - Capacity indicators for each template
   - "Start from template" and "Build from scratch" options
   - Template categories and filters
   - Search functionality for templates

2. GIVEN I browse the template library
   WHEN I view template details
   THEN I should see:
   - Large preview image of layout
   - Total seat capacity
   - Section breakdown (Orchestra, Balcony, etc.)
   - Recommended event types
   - Customization options available
   - "Use This Template" button

3. GIVEN I select a template
   WHEN I instantiate it for my event
   THEN the system should:
   - Create a copy of the template
   - Allow me to customize layout (add/remove rows, seats)
   - Let me rename sections
   - Enable pricing customization per section
   - Preserve the basic structure while allowing edits
   - Show "Based on [Template Name]" indicator

4. GIVEN I need specific venue layouts
   WHEN I use built-in templates
   THEN I should have access to:
   - Theater: Orchestra, Mezzanine, Balcony (500-2000 seats)
   - Arena/Stadium: Floor, Lower Bowl, Upper Bowl, Luxury Boxes (2000-10000 seats)
   - Classroom: Rows of tables, lecture hall style (50-200 seats)
   - Banquet: Round tables of 8-10, rectangular layouts (100-500 seats)
   - Outdoor Festival: General admission zones, VIP platforms (1000-5000 capacity)
   - Black Box Theater: Flexible seating configurations (50-200 seats)

5. GIVEN I create a custom seating chart I want to reuse
   WHEN I save it as a personal template
   THEN I should be able to:
   - Save chart as "My Template"
   - Name and describe the template
   - Set visibility (private or org-wide)
   - Tag with venue name or location
   - Reuse for future events
   - Edit template without affecting past events

6. GIVEN I manage multiple venues
   WHEN I access my saved templates
   THEN I should be able to:
   - View all my custom templates
   - Filter by venue or capacity
   - Preview before using
   - Edit existing templates
   - Delete unused templates
   - Share templates with team members
   - Import/export templates (JSON format)

---

## Tasks / Subtasks

- [ ] Design template data structure (AC: 1, 3)
  - [ ] Template model in database
  - [ ] Template JSON schema
  - [ ] Relationship to SeatingChart
  - [ ] Template metadata (capacity, type, etc.)

- [ ] Create built-in template library (AC: 4)
  - [ ] Theater template (500-2000 seats)
  - [ ] Arena template (2000-10000 seats)
  - [ ] Classroom template (50-200 seats)
  - [ ] Banquet template (100-500 seats)
  - [ ] Outdoor festival template (1000-5000 capacity)
  - [ ] Black box theater template (50-200 seats)

- [ ] Build template browser UI (AC: 1, 2)
  - [ ] Template gallery with thumbnails
  - [ ] Category filters
  - [ ] Search functionality
  - [ ] Template detail modal

- [ ] Implement template instantiation (AC: 3)
  - [ ] Copy template to new chart
  - [ ] Allow customization
  - [ ] Link to original template
  - [ ] Validation on instantiation

- [ ] Create template preview generator (AC: 1, 2)
  - [ ] Generate thumbnail images
  - [ ] Show capacity stats
  - [ ] Display section breakdown
  - [ ] Render preview in modal

- [ ] Build custom template saving (AC: 5)
  - [ ] "Save as Template" button
  - [ ] Template naming form
  - [ ] Visibility settings
  - [ ] Tag management

- [ ] Implement template management UI (AC: 6)
  - [ ] My Templates dashboard
  - [ ] Template editing
  - [ ] Template deletion
  - [ ] Template sharing

- [ ] Add template import/export (AC: 6)
  - [ ] Export template to JSON
  - [ ] Import template from JSON
  - [ ] Validation on import
  - [ ] Error handling

- [ ] Create template categorization (AC: 1)
  - [ ] Category enum (Theater, Arena, etc.)
  - [ ] Tag system for filtering
  - [ ] Capacity ranges
  - [ ] Event type recommendations

- [ ] Build template search (AC: 1)
  - [ ] Search by name
  - [ ] Filter by capacity
  - [ ] Filter by category
  - [ ] Sort by popularity/recent

- [ ] Implement template sharing (AC: 6)
  - [ ] Share with specific users
  - [ ] Share with organization
  - [ ] Permission management
  - [ ] Shared template library

- [ ] Add template version control (AC: 5, 6)
  - [ ] Track template versions
  - [ ] Update templates without affecting existing charts
  - [ ] Show version history
  - [ ] Rollback capability

- [ ] Create template analytics (AC: 6)
  - [ ] Track template usage
  - [ ] Popular templates
  - [ ] User adoption
  - [ ] Improvement suggestions

---

## Dev Notes

### Architecture References

**Template System** (`docs/architecture/seating-architecture.md`):
- Built-in templates provided by platform
- User-created custom templates
- Template instantiation creates new SeatingChart
- Templates are immutable (editing creates new version)
- Support for import/export via JSON

**Template Structure** (`docs/architecture/templates.md`):
- Template contains complete chart definition
- Includes sections, seats, and positioning
- Metadata for search and filtering
- Preview image generation
- Versioning for updates

**Database Schema**:
```prisma
model SeatingChartTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  category        TemplateCategory
  capacity        Int
  venueType       String?
  thumbnailUrl    String?
  chartData       Json     // Complete chart structure
  sections        Json     // Section definitions
  isPublic        Boolean  @default(false)
  isBuiltIn       Boolean  @default(false)
  createdBy       String?
  creator         User?    @relation(fields: [createdBy], references: [id])
  organizationId  String?
  tags            String[]
  usageCount      Int      @default(0)
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category, capacity])
  @@index([createdBy])
  @@index([isPublic, isBuiltIn])
}

enum TemplateCategory {
  THEATER
  ARENA
  STADIUM
  CLASSROOM
  BANQUET
  OUTDOOR_FESTIVAL
  BLACK_BOX
  CONFERENCE
  CONCERT_HALL
  CUSTOM
}
```

**Built-in Template Examples**:

```typescript
// lib/seating/templates/theater.ts
export const theaterTemplate: SeatingChartTemplate = {
  name: 'Classic Theater',
  description: 'Traditional proscenium theater with orchestra, mezzanine, and balcony',
  category: 'THEATER',
  capacity: 1200,
  venueType: 'Proscenium Theater',
  chartData: {
    width: 800,
    height: 1000,
    stage: { x: 400, y: 50, width: 300, height: 100 },
  },
  sections: [
    {
      name: 'Orchestra',
      rows: 20,
      seatsPerRow: 30,
      startRow: 'A',
      startNumber: 1,
      curve: 0.2, // Slight curve toward stage
      y: 200,
    },
    {
      name: 'Mezzanine',
      rows: 10,
      seatsPerRow: 28,
      startRow: 'A',
      startNumber: 1,
      y: 600,
    },
    {
      name: 'Balcony',
      rows: 10,
      seatsPerRow: 32,
      startRow: 'A',
      startNumber: 1,
      y: 800,
    },
  ],
};

// lib/seating/templates/arena.ts
export const arenaTemplate: SeatingChartTemplate = {
  name: 'Arena Bowl',
  description: 'Multi-level arena with floor seating and bowl sections',
  category: 'ARENA',
  capacity: 5000,
  venueType: 'Indoor Arena',
  chartData: {
    width: 1200,
    height: 1200,
    center: { x: 600, y: 600 },
    stage: { x: 600, y: 300, radius: 150 },
  },
  sections: [
    {
      name: 'Floor',
      type: 'circular',
      rows: 15,
      seatsPerRow: 40,
      startRow: 1,
      radius: 200,
    },
    {
      name: 'Lower Bowl',
      type: 'circular',
      rows: 20,
      seatsPerRow: 60,
      startRow: 101,
      radius: 400,
    },
    {
      name: 'Upper Bowl',
      type: 'circular',
      rows: 25,
      seatsPerRow: 80,
      startRow: 201,
      radius: 550,
    },
  ],
};

// lib/seating/templates/banquet.ts
export const banquetTemplate: SeatingChartTemplate = {
  name: 'Banquet Hall - Round Tables',
  description: 'Banquet setup with round tables of 10',
  category: 'BANQUET',
  capacity: 300,
  venueType: 'Banquet Hall',
  chartData: {
    width: 1000,
    height: 800,
  },
  sections: [
    {
      name: 'Floor',
      type: 'tables',
      tableCount: 30,
      seatsPerTable: 10,
      tableShape: 'round',
      tableSpacing: 50,
      layout: 'grid',
    },
  ],
};
```

**Template Instantiation**:
```typescript
// lib/seating/instantiate-template.ts
export async function instantiateTemplate(
  templateId: string,
  eventId: string,
  customizations?: Partial<SeatingChart>
): Promise<SeatingChart> {
  const template = await prisma.seatingChartTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Create new chart from template
  const chart = await prisma.seatingChart.create({
    data: {
      eventId,
      name: customizations?.name || template.name,
      chartData: template.chartData,
      totalSeats: template.capacity,
      templateId: template.id,
      isTemplate: false,
    },
  });

  // Create sections from template
  const sections = template.sections as any[];
  for (const sectionDef of sections) {
    const section = await prisma.section.create({
      data: {
        chartId: chart.id,
        name: sectionDef.name,
        color: sectionDef.color,
      },
    });

    // Generate seats for section
    const seats = generateSeatsFromDefinition(sectionDef, section.id);
    await prisma.seat.createMany({
      data: seats,
    });
  }

  // Increment template usage count
  await prisma.seatingChartTemplate.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return chart;
}
```

**Template Browser Component**:
```typescript
// components/seating/TemplateBrowser.tsx
export function TemplateBrowser({ onSelectTemplate }: Props) {
  const [category, setCategory] = useState<TemplateCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates } = useQuery({
    queryKey: ['templates', category, searchQuery],
    queryFn: () => fetchTemplates({ category, search: searchQuery }),
  });

  return (
    <div className="template-browser">
      <div className="filters">
        <input
          type="search"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          <option value="THEATER">Theater</option>
          <option value="ARENA">Arena</option>
          <option value="CLASSROOM">Classroom</option>
          <option value="BANQUET">Banquet</option>
          <option value="OUTDOOR_FESTIVAL">Outdoor Festival</option>
        </select>
      </div>

      <div className="template-grid">
        {templates?.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <div className="template-card">
      <img src={template.thumbnailUrl} alt={template.name} />
      <h3>{template.name}</h3>
      <p>{template.description}</p>
      <div className="template-stats">
        <span>{template.capacity} seats</span>
        <span>{template.category}</span>
      </div>
      <button onClick={onSelect}>Use This Template</button>
    </div>
  );
}
```

**Save as Template**:
```typescript
// components/seating/SaveAsTemplate.tsx
export function SaveAsTemplateButton({ chartId }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  const handleSave = async (data: TemplateData) => {
    const chart = await fetchSeatingChart(chartId);

    await createTemplate({
      name: data.name,
      description: data.description,
      category: data.category,
      capacity: chart.totalSeats,
      chartData: chart.chartData,
      sections: chart.sections,
      isPublic: data.isPublic,
      tags: data.tags,
    });

    setShowDialog(false);
    toast.success('Template saved!');
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Save as Template
      </button>

      {showDialog && (
        <Dialog onClose={() => setShowDialog(false)}>
          <form onSubmit={handleSave}>
            <input name="name" placeholder="Template name" required />
            <textarea name="description" placeholder="Description" />
            <select name="category">
              <option value="CUSTOM">Custom</option>
              <option value="THEATER">Theater</option>
              <option value="ARENA">Arena</option>
              {/* ... more options */}
            </select>
            <label>
              <input type="checkbox" name="isPublic" />
              Share with organization
            </label>
            <button type="submit">Save Template</button>
          </form>
        </Dialog>
      )}
    </>
  );
}
```

**Template Import/Export**:
```typescript
// lib/seating/template-io.ts
export function exportTemplate(template: SeatingChartTemplate): string {
  const exportData = {
    version: '1.0',
    template: {
      name: template.name,
      description: template.description,
      category: template.category,
      capacity: template.capacity,
      chartData: template.chartData,
      sections: template.sections,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importTemplate(
  jsonData: string,
  userId: string
): Promise<SeatingChartTemplate> {
  const data = JSON.parse(jsonData);

  // Validate format
  if (data.version !== '1.0') {
    throw new Error('Unsupported template version');
  }

  // Create template
  const template = await prisma.seatingChartTemplate.create({
    data: {
      name: data.template.name,
      description: data.template.description,
      category: data.template.category,
      capacity: data.template.capacity,
      chartData: data.template.chartData,
      sections: data.template.sections,
      createdBy: userId,
      isPublic: false,
    },
  });

  return template;
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── seating/
│   │       ├── templates/route.ts
│   │       ├── templates/[id]/route.ts
│   │       └── templates/import/route.ts
│   └── organizer/
│       └── seating/
│           ├── templates/page.tsx
│           └── my-templates/page.tsx
├── components/
│   └── seating/
│       ├── TemplateBrowser.tsx
│       ├── TemplateCard.tsx
│       ├── SaveAsTemplate.tsx
│       └── TemplatePreview.tsx
└── lib/
    └── seating/
        ├── templates/
        │   ├── theater.ts
        │   ├── arena.ts
        │   ├── classroom.ts
        │   ├── banquet.ts
        │   └── outdoor.ts
        ├── instantiate-template.ts
        └── template-io.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for template instantiation
- Unit tests for template import/export
- Unit tests for seat generation from template
- Integration test for template creation
- Integration test for template sharing
- E2E test for browsing templates
- E2E test for using template
- E2E test for saving custom template
- E2E test for template import/export
- Verify all built-in templates are valid
- Test template search and filtering
- Test template customization after instantiation

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial story creation | SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*