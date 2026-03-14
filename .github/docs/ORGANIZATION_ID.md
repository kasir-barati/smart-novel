# What is `orgId` and Why Use It?

**`orgId` (Organization ID)** is a **multi-tenancy** concept that groups users and resources together. Think of it as:

- A **company/organization** identifier
- A **tenant** in SaaS applications
- A **workspace** or **team**

## Why It's Already in Your Cerbos Policies

Looking at your existing Cerbos policies, they already use `orgId` extensively:

```yaml
# From chapter_resource.yaml
- actions: ['read']
  effect: EFFECT_ALLOW
  roles: ['user', 'admin']
  condition:
    match:
      all:
        of:
          - expr: request.resource.attr.orgId == request.principal.attr.orgId
          - expr: request.resource.attr.visibility == "org"
```

This rule means: "Users can read chapters if the chapter's orgId matches their orgId AND visibility is 'org'"

## Real-World Example

**Scenario: Publishing Platform with Multiple Organizations**

**Organization A (Acme Comics):**

- Users: alice@acme.com (admin), bob@acme.com (writer)
- Novels: "Super Heroes Vol 1" (orgId: acme-comics)

**Organization B (Beta Books):**

- Users: charlie@beta.com (admin), diana@beta.com (writer)
- Novels: "Mystery Tales" (orgId: beta-books)

**With orgId:**

- bob (writer @ Acme) can edit chapters of "Super Heroes" ✓
- bob cannot edit chapters of "Mystery Tales" ✗ (different org)
- diana (writer @ Beta) can edit chapters of "Mystery Tales" ✓
- diana cannot edit chapters of "Super Heroes" ✗ (different org)

## For Your Use Case

Since you have `orgId` in your Cerbos policies but not in your database, we have two options:

### **Option 1: Simplified (No Real Multi-Tenancy)** ✅ **RECOMMENDED for now**

- Don't use orgId at all
- Writers can update ttsFriendlyContent of chapters they have access to based on other criteria
- Simpler for local development
- Easier to understand

### **Option 2: Full Multi-Tenancy**

- Add `orgId` to Novel table in database
- Add `orgId` to user JWT claims in ZITADEL
- Writers can only edit chapters from novels in their organization
- More complex but production-ready
