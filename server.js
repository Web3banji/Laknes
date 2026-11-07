var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/shared/pagination.ts
function sanitizePagination(params) {
  const page = Math.max(1, Number(params?.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params?.limit) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  const sortOrder = params?.sortOrder === "asc" ? "asc" : "desc";
  return {
    page,
    limit,
    offset,
    sortBy: params?.sortBy,
    sortOrder
  };
}
function buildPaginationMeta(totalItems, page, limit) {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}
var DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT;
var init_pagination = __esm({
  "src/shared/pagination.ts"() {
    DEFAULT_PAGE = 1;
    DEFAULT_LIMIT = 20;
    MAX_LIMIT = 100;
  }
});

// src/shared/datetime.ts
function nowISO() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function isValidISODate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}
var init_datetime = __esm({
  "src/shared/datetime.ts"() {
  }
});

// src/dal/sqlite-adapter.ts
import fs from "node:fs";
import path from "node:path";
import crypto2 from "node:crypto";
import { DatabaseSync } from "node:sqlite";
var SqliteDatabaseAdapter;
var init_sqlite_adapter = __esm({
  "src/dal/sqlite-adapter.ts"() {
    init_pagination();
    init_datetime();
    SqliteDatabaseAdapter = class {
      constructor(customPath) {
        this.name = "SqliteDatabaseAdapter (Native Node.js SQLite)";
        this.status = "DISCONNECTED";
        this.isPersistent = true;
        const dataDir = path.resolve(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = customPath || path.resolve(dataDir, "laknes.db");
        this.connectSync();
      }
      connectSync() {
        try {
          this.status = "CONNECTING";
          this.db = new DatabaseSync(this.dbPath, {
            enableForeignKeyConstraints: true
          });
          this.initSchema();
          this.status = "CONNECTED";
          this.repositories = this.buildRepositories();
        } catch (err) {
          this.status = "ERROR";
          throw err;
        }
      }
      async connect() {
        if (this.status !== "CONNECTED") {
          this.connectSync();
        }
      }
      async disconnect() {
        if (this.db) {
          this.db.close();
          this.status = "DISCONNECTED";
        }
      }
      async checkHealth() {
        return {
          status: this.status,
          adapterName: this.name,
          isPersistent: true,
          message: `SQLite database operational at ${this.dbPath}`
        };
      }
      getRepositories() {
        if (!this.repositories) {
          this.connectSync();
        }
        return this.repositories;
      }
      getDb() {
        if (!this.db) {
          this.connectSync();
        }
        return this.db;
      }
      initSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        profile_image TEXT,
        bio TEXT,
        x_account TEXT,
        social_links TEXT,
        roles TEXT NOT NULL,
        profile_completed INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        logo_url TEXT,
        banner_url TEXT,
        short_description TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        website_url TEXT NOT NULL,
        documentation_url TEXT,
        community_url TEXT,
        blockchain_network TEXT,
        social_links TEXT NOT NULL,
        contract_addresses TEXT,
        representative_info TEXT,
        supporting_info TEXT,
        ecosystem TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project_memberships (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        role TEXT NOT NULL,
        membership_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, project_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_updates (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        links TEXT NOT NULL,
        publication_status TEXT NOT NULL,
        published_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        instructions TEXT NOT NULL,
        quest_type TEXT NOT NULL,
        eligibility_rules TEXT NOT NULL,
        completion_criteria TEXT NOT NULL,
        start_at TEXT NOT NULL,
        deadline TEXT,
        reward_configuration TEXT NOT NULL,
        publication_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quest_participations (
        id TEXT PRIMARY KEY,
        quest_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        participation_status TEXT NOT NULL,
        completion_status TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        submission_proof TEXT,
        verified_by TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        UNIQUE(quest_id, user_id),
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_follows (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, project_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS saved_projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, project_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_reviews (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        review_notes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS content_reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        report_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(verification_status);
      CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
      CREATE INDEX IF NOT EXISTS idx_memberships_proj ON project_memberships(project_id);
      CREATE INDEX IF NOT EXISTS idx_memberships_user ON project_memberships(user_id);
      CREATE INDEX IF NOT EXISTS idx_updates_proj ON project_updates(project_id);
      CREATE INDEX IF NOT EXISTS idx_follows_user ON project_follows(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_proj ON project_reviews(project_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(report_status);
      CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    `);
        try {
          this.db.exec("ALTER TABLE users ADD COLUMN name TEXT");
        } catch {
        }
        try {
          this.db.exec("ALTER TABLE users ADD COLUMN x_account TEXT");
        } catch {
        }
        try {
          this.db.exec("ALTER TABLE users ADD COLUMN social_links TEXT");
        } catch {
        }
        try {
          this.db.exec("ALTER TABLE users ADD COLUMN interests TEXT");
        } catch {
        }
        try {
          this.db.exec("ALTER TABLE users ADD COLUMN header_image TEXT");
        } catch {
        }
        try {
          this.db.exec("ALTER TABLE projects ADD COLUMN community_url TEXT");
        } catch {
        }
        try {
          this.db.exec("ALTER TABLE projects ADD COLUMN blockchain_network TEXT");
        } catch {
        }
        try {
          this.db.exec(`
        CREATE TABLE IF NOT EXISTS saved_quests (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          quest_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(user_id, quest_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_saved_quests_user ON saved_quests(user_id);
      `);
        } catch {
        }
        this.seedCanonicalDataIfNeeded();
      }
      seedCanonicalDataIfNeeded() {
        try {
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const adminExists = this.db.prepare("SELECT id FROM users WHERE email = 'admin@elysium.org'").get();
          if (!adminExists) {
            const adminId = crypto2.randomUUID();
            const salt = crypto2.randomBytes(16).toString("hex");
            const passwordHash = crypto2.pbkdf2Sync("AdminElysium2026!", salt, 1e4, 64, "sha512").toString("hex");
            this.db.prepare(`
          INSERT INTO users (id, username, email, password_hash, salt, profile_image, bio, roles, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
              adminId,
              "elysium_admin",
              "admin@elysium.org",
              passwordHash,
              salt,
              "https://lh3.googleusercontent.com/aida/AEtjO1V5cyyaQTFsv5FnNtyApKuUcWoOSBmKQpBBqqKlsisjUy2HBlwR_lSTNLyzJzm9QhyVvAx8Xq2ko76Al4Wsbz6iDzK8MWNRKxDpEbXYWPk-qXv3fK5Kg-2xj_4pGl4yXPOr4m93QMmT_ny1urp5u4UlKpNeS_aKY88fn7_DVV4X0fv4kRZhGxvmamNUmyaxGGBdKA8KSQ9OswtwOtBuDCGyvmYreRkbAoOvu84DmMod7KSwYQ1Uz-DNGh4IYYQfX9lv8kXkEtNlRg",
              "Elysium Foundation Core Ecosystem Maintainer",
              JSON.stringify(["USER", "ADMIN"]),
              now,
              now
            );
          }
        } catch (err) {
          console.warn("Admin user setup notice:", err);
        }
      }
      mapUserRow(row, includeCredentials = false) {
        const user = {
          id: String(row.id),
          name: row.name ? String(row.name) : void 0,
          username: String(row.username),
          email: String(row.email),
          profileImage: row.profile_image ? String(row.profile_image) : void 0,
          headerImage: row.header_image ? String(row.header_image) : void 0,
          bio: row.bio ? String(row.bio) : void 0,
          interests: row.interests ? JSON.parse(String(row.interests)) : [],
          xAccount: row.x_account ? String(row.x_account) : void 0,
          socialLinks: row.social_links ? JSON.parse(String(row.social_links)) : void 0,
          roles: JSON.parse(String(row.roles || "[]")),
          profileCompleted: Boolean(row.profile_completed ?? 1),
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at)
        };
        if (includeCredentials) {
          return {
            ...user,
            passwordHash: String(row.password_hash),
            salt: String(row.salt)
          };
        }
        return user;
      }
      mapProjectRow(row) {
        return {
          id: String(row.id),
          name: String(row.name),
          slug: String(row.slug),
          logoUrl: row.logo_url ? String(row.logo_url) : void 0,
          bannerUrl: row.banner_url ? String(row.banner_url) : void 0,
          shortDescription: String(row.short_description),
          description: String(row.description),
          category: row.category,
          websiteUrl: String(row.website_url),
          documentationUrl: row.documentation_url ? String(row.documentation_url) : void 0,
          communityUrl: row.community_url ? String(row.community_url) : void 0,
          blockchainNetwork: row.blockchain_network ? String(row.blockchain_network) : void 0,
          socialLinks: JSON.parse(String(row.social_links || "{}")),
          contractAddresses: row.contract_addresses ? JSON.parse(String(row.contract_addresses)) : void 0,
          representativeInfo: row.representative_info ? JSON.parse(String(row.representative_info)) : void 0,
          supportingInfo: row.supporting_info ? String(row.supporting_info) : void 0,
          ecosystem: String(row.ecosystem),
          verificationStatus: row.verification_status,
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at)
        };
      }
      buildRepositories() {
        const db2 = this.db;
        const mapUser = this.mapUserRow;
        const mapProject = this.mapProjectRow;
        const users2 = {
          async findById(id) {
            const row = db2.prepare("SELECT * FROM users WHERE id = ?").get(id);
            return row ? mapUser(row, false) : null;
          },
          async findByIdWithCredentials(id) {
            const row = db2.prepare("SELECT * FROM users WHERE id = ?").get(id);
            return row ? mapUser(row, true) : null;
          },
          async findByEmail(email) {
            const row = db2.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email);
            return row ? mapUser(row, false) : null;
          },
          async findByEmailWithCredentials(email) {
            const row = db2.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email);
            return row ? mapUser(row, true) : null;
          },
          async findByUsername(username) {
            const row = db2.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(username);
            return row ? mapUser(row, false) : null;
          },
          async create(userData) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare(`
          INSERT INTO users (
            id, name, username, email, password_hash, salt, profile_image, bio,
            x_account, social_links, roles, profile_completed, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
              id,
              userData.name || null,
              userData.username,
              userData.email.toLowerCase(),
              userData.passwordHash,
              userData.salt,
              userData.profileImage || null,
              userData.bio || null,
              userData.xAccount || null,
              userData.socialLinks ? JSON.stringify(userData.socialLinks) : null,
              JSON.stringify(userData.roles),
              userData.profileCompleted === false ? 0 : 1,
              now,
              now
            );
            return await this.findById(id);
          },
          async update(id, updates2) {
            const existing = await this.findById(id);
            if (!existing) throw new Error(`User ${id} not found`);
            const sets = [];
            const params = [];
            if (updates2.name !== void 0) {
              sets.push("name = ?");
              params.push(updates2.name || null);
            }
            if (updates2.username !== void 0) {
              sets.push("username = ?");
              params.push(updates2.username);
            }
            if (updates2.email !== void 0) {
              sets.push("email = ?");
              params.push(updates2.email.toLowerCase());
            }
            if (updates2.profileImage !== void 0) {
              sets.push("profile_image = ?");
              params.push(updates2.profileImage || null);
            }
            if (updates2.headerImage !== void 0) {
              sets.push("header_image = ?");
              params.push(updates2.headerImage || null);
            }
            if (updates2.bio !== void 0) {
              sets.push("bio = ?");
              params.push(updates2.bio || null);
            }
            if (updates2.interests !== void 0) {
              sets.push("interests = ?");
              params.push(updates2.interests ? JSON.stringify(updates2.interests) : null);
            }
            if (updates2.xAccount !== void 0) {
              sets.push("x_account = ?");
              params.push(updates2.xAccount || null);
            }
            if (updates2.socialLinks !== void 0) {
              sets.push("social_links = ?");
              params.push(updates2.socialLinks ? JSON.stringify(updates2.socialLinks) : null);
            }
            if (updates2.profileCompleted !== void 0) {
              sets.push("profile_completed = ?");
              params.push(updates2.profileCompleted ? 1 : 0);
            }
            if (updates2.roles !== void 0) {
              sets.push("roles = ?");
              params.push(JSON.stringify(updates2.roles));
            }
            if (updates2.passwordHash !== void 0 && updates2.salt !== void 0) {
              sets.push("password_hash = ?", "salt = ?");
              params.push(updates2.passwordHash, updates2.salt);
            }
            sets.push("updated_at = ?");
            params.push(nowISO());
            params.push(id);
            db2.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);
            return await this.findById(id);
          },
          async delete(id) {
            const res = db2.prepare("DELETE FROM users WHERE id = ?").run(id);
            return res.changes > 0;
          },
          async count() {
            const row = db2.prepare("SELECT COUNT(*) as c FROM users").get();
            return row ? Number(row.c) : 0;
          }
        };
        const projects2 = {
          async findById(id) {
            const row = db2.prepare("SELECT * FROM projects WHERE id = ?").get(id);
            return row ? mapProject(row) : null;
          },
          async findBySlug(slug) {
            const row = db2.prepare("SELECT * FROM projects WHERE LOWER(slug) = LOWER(?)").get(slug);
            return row ? mapProject(row) : null;
          },
          async findMany(filters) {
            const where = [];
            const params = [];
            if (filters.verificationStatus) {
              where.push("verification_status = ?");
              params.push(filters.verificationStatus);
            }
            if (filters.category) {
              where.push("category = ?");
              params.push(filters.category);
            }
            if (filters.ecosystem) {
              where.push("LOWER(ecosystem) = LOWER(?)");
              params.push(filters.ecosystem);
            }
            if (filters.search) {
              where.push("(slug LIKE ? OR name LIKE ? OR short_description LIKE ? OR description LIKE ?)");
              const q = `%${filters.search}%`;
              params.push(q, q, q, q);
            }
            const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
            const countRow = db2.prepare(`SELECT COUNT(*) as total FROM projects ${whereSql}`).get(...params);
            const totalItems = countRow ? Number(countRow.total) : 0;
            const { page, limit, offset, sortBy, sortOrder } = sanitizePagination(filters);
            const orderColumn = sortBy === "name" ? "name" : "created_at";
            const orderDirection = sortOrder.toUpperCase();
            const rows = db2.prepare(`
          SELECT * FROM projects
          ${whereSql}
          ORDER BY ${orderColumn} ${orderDirection}
          LIMIT ? OFFSET ?
        `).all(...params, limit, offset);
            const items = rows.map((r) => mapProject(r));
            return {
              items,
              meta: buildPaginationMeta(totalItems, page, limit)
            };
          },
          async create(projectData) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare(`
          INSERT INTO projects (
            id, name, slug, logo_url, banner_url, short_description, description,
            category, website_url, documentation_url, community_url, blockchain_network,
            social_links, contract_addresses, representative_info, supporting_info,
            ecosystem, verification_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
              id,
              projectData.name,
              projectData.slug.toLowerCase(),
              projectData.logoUrl || null,
              projectData.bannerUrl || null,
              projectData.shortDescription,
              projectData.description,
              projectData.category,
              projectData.websiteUrl,
              projectData.documentationUrl || null,
              projectData.communityUrl || null,
              projectData.blockchainNetwork || null,
              JSON.stringify(projectData.socialLinks || {}),
              projectData.contractAddresses ? JSON.stringify(projectData.contractAddresses) : null,
              projectData.representativeInfo ? JSON.stringify(projectData.representativeInfo) : null,
              projectData.supportingInfo || null,
              projectData.ecosystem,
              projectData.verificationStatus,
              now,
              now
            );
            return await this.findById(id);
          },
          async update(id, updates2) {
            const sets = [];
            const params = [];
            if (updates2.name !== void 0) {
              sets.push("name = ?");
              params.push(updates2.name);
            }
            if (updates2.slug !== void 0) {
              sets.push("slug = ?");
              params.push(updates2.slug.toLowerCase());
            }
            if (updates2.logoUrl !== void 0) {
              sets.push("logo_url = ?");
              params.push(updates2.logoUrl);
            }
            if (updates2.bannerUrl !== void 0) {
              sets.push("banner_url = ?");
              params.push(updates2.bannerUrl);
            }
            if (updates2.shortDescription !== void 0) {
              sets.push("short_description = ?");
              params.push(updates2.shortDescription);
            }
            if (updates2.description !== void 0) {
              sets.push("description = ?");
              params.push(updates2.description);
            }
            if (updates2.category !== void 0) {
              sets.push("category = ?");
              params.push(updates2.category);
            }
            if (updates2.websiteUrl !== void 0) {
              sets.push("website_url = ?");
              params.push(updates2.websiteUrl);
            }
            if (updates2.documentationUrl !== void 0) {
              sets.push("documentation_url = ?");
              params.push(updates2.documentationUrl);
            }
            if (updates2.communityUrl !== void 0) {
              sets.push("community_url = ?");
              params.push(updates2.communityUrl);
            }
            if (updates2.blockchainNetwork !== void 0) {
              sets.push("blockchain_network = ?");
              params.push(updates2.blockchainNetwork);
            }
            if (updates2.socialLinks !== void 0) {
              sets.push("social_links = ?");
              params.push(JSON.stringify(updates2.socialLinks));
            }
            if (updates2.contractAddresses !== void 0) {
              sets.push("contract_addresses = ?");
              params.push(JSON.stringify(updates2.contractAddresses));
            }
            if (updates2.representativeInfo !== void 0) {
              sets.push("representative_info = ?");
              params.push(JSON.stringify(updates2.representativeInfo));
            }
            if (updates2.supportingInfo !== void 0) {
              sets.push("supporting_info = ?");
              params.push(updates2.supportingInfo);
            }
            if (updates2.verificationStatus !== void 0) {
              sets.push("verification_status = ?");
              params.push(updates2.verificationStatus);
            }
            sets.push("updated_at = ?");
            params.push(nowISO());
            params.push(id);
            db2.prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`).run(...params);
            return await this.findById(id);
          },
          async count(filters = {}) {
            const where = [];
            const params = [];
            if (filters.verificationStatus) {
              where.push("verification_status = ?");
              params.push(filters.verificationStatus);
            }
            if (filters.category) {
              where.push("category = ?");
              params.push(filters.category);
            }
            const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
            const row = db2.prepare(`SELECT COUNT(*) as c FROM projects ${whereSql}`).get(...params);
            return row ? Number(row.c) : 0;
          }
        };
        const memberships = {
          async findById(id) {
            const row = db2.prepare("SELECT * FROM project_memberships WHERE id = ?").get(id);
            if (!row) return null;
            return {
              id: String(row.id),
              userId: String(row.user_id),
              projectId: String(row.project_id),
              role: row.role,
              membershipStatus: row.membership_status,
              createdAt: String(row.created_at)
            };
          },
          async findByUserAndProject(userId, projectId) {
            const row = db2.prepare("SELECT * FROM project_memberships WHERE user_id = ? AND project_id = ?").get(userId, projectId);
            if (!row) return null;
            return {
              id: String(row.id),
              userId: String(row.user_id),
              projectId: String(row.project_id),
              role: row.role,
              membershipStatus: row.membership_status,
              createdAt: String(row.created_at)
            };
          },
          async findByProject(projectId) {
            const rows = db2.prepare(`
          SELECT pm.*, u.username, u.profile_image, u.bio, u.created_at as user_created_at
          FROM project_memberships pm
          LEFT JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = ?
        `).all(projectId);
            return rows.map((r) => ({
              id: String(r.id),
              userId: String(r.user_id),
              projectId: String(r.project_id),
              role: r.role,
              membershipStatus: r.membership_status,
              createdAt: String(r.created_at),
              user: r.username ? {
                id: String(r.user_id),
                username: String(r.username),
                profileImage: r.profile_image ? String(r.profile_image) : void 0,
                bio: r.bio ? String(r.bio) : void 0,
                createdAt: String(r.user_created_at)
              } : void 0
            }));
          },
          async findByUser(userId) {
            const rows = db2.prepare("SELECT * FROM project_memberships WHERE user_id = ?").all(userId);
            return rows.map((r) => ({
              id: String(r.id),
              userId: String(r.user_id),
              projectId: String(r.project_id),
              role: r.role,
              membershipStatus: r.membership_status,
              createdAt: String(r.created_at)
            }));
          },
          async create(membership) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare(`
          INSERT INTO project_memberships (id, user_id, project_id, role, membership_status, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
              id,
              membership.userId,
              membership.projectId,
              membership.role,
              membership.membershipStatus,
              now
            );
            return await this.findById(id);
          },
          async update(id, updates2) {
            const sets = [];
            const params = [];
            if (updates2.role !== void 0) {
              sets.push("role = ?");
              params.push(updates2.role);
            }
            if (updates2.membershipStatus !== void 0) {
              sets.push("membership_status = ?");
              params.push(updates2.membershipStatus);
            }
            params.push(id);
            db2.prepare(`UPDATE project_memberships SET ${sets.join(", ")} WHERE id = ?`).run(...params);
            return await this.findById(id);
          },
          async delete(id) {
            const res = db2.prepare("DELETE FROM project_memberships WHERE id = ?").run(id);
            return res.changes > 0;
          }
        };
        const updates = {
          async findById(id) {
            const r = db2.prepare("SELECT * FROM project_updates WHERE id = ?").get(id);
            if (!r) return null;
            return {
              id: String(r.id),
              projectId: String(r.project_id),
              authorId: String(r.author_id),
              title: String(r.title),
              content: String(r.content),
              links: JSON.parse(String(r.links || "[]")),
              publicationStatus: r.publication_status,
              publishedAt: r.published_at ? String(r.published_at) : void 0,
              createdAt: String(r.created_at),
              updatedAt: String(r.updated_at)
            };
          },
          async findByProject(projectId, pagination, includeNonPublished = false) {
            const whereClause = includeNonPublished ? "WHERE project_id = ?" : "WHERE project_id = ? AND publication_status = 'PUBLISHED'";
            const countRow = db2.prepare(`SELECT COUNT(*) as c FROM project_updates ${whereClause}`).get(projectId);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare(`
          SELECT * FROM project_updates
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `).all(projectId, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              projectId: String(r.project_id),
              authorId: String(r.author_id),
              title: String(r.title),
              content: String(r.content),
              links: JSON.parse(String(r.links || "[]")),
              publicationStatus: r.publication_status,
              publishedAt: r.published_at ? String(r.published_at) : void 0,
              createdAt: String(r.created_at),
              updatedAt: String(r.updated_at)
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async create(updateData) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare(`
          INSERT INTO project_updates (id, project_id, author_id, title, content, links, publication_status, published_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
              id,
              updateData.projectId,
              updateData.authorId,
              updateData.title,
              updateData.content,
              JSON.stringify(updateData.links || []),
              updateData.publicationStatus,
              updateData.publishedAt || null,
              now,
              now
            );
            return await this.findById(id);
          },
          async update(id, u) {
            const sets = [];
            const params = [];
            if (u.title !== void 0) {
              sets.push("title = ?");
              params.push(u.title);
            }
            if (u.content !== void 0) {
              sets.push("content = ?");
              params.push(u.content);
            }
            if (u.links !== void 0) {
              sets.push("links = ?");
              params.push(JSON.stringify(u.links));
            }
            if (u.publicationStatus !== void 0) {
              sets.push("publication_status = ?");
              params.push(u.publicationStatus);
            }
            if (u.publishedAt !== void 0) {
              sets.push("published_at = ?");
              params.push(u.publishedAt);
            }
            sets.push("updated_at = ?");
            params.push(nowISO());
            params.push(id);
            db2.prepare(`UPDATE project_updates SET ${sets.join(", ")} WHERE id = ?`).run(...params);
            return await this.findById(id);
          },
          async delete(id) {
            const res = db2.prepare("DELETE FROM project_updates WHERE id = ?").run(id);
            return res.changes > 0;
          }
        };
        const quests2 = {
          async findById(id) {
            const r = db2.prepare("SELECT * FROM quests WHERE id = ?").get(id);
            if (!r) return null;
            return {
              id: String(r.id),
              projectId: String(r.project_id),
              title: String(r.title),
              description: String(r.description),
              instructions: String(r.instructions),
              questType: r.quest_type,
              eligibilityRules: JSON.parse(String(r.eligibility_rules || "{}")),
              completionCriteria: JSON.parse(String(r.completion_criteria || "{}")),
              startAt: String(r.start_at),
              deadline: r.deadline ? String(r.deadline) : void 0,
              rewardConfiguration: JSON.parse(String(r.reward_configuration || "{}")),
              publicationStatus: r.publication_status,
              createdAt: String(r.created_at),
              updatedAt: String(r.updated_at)
            };
          },
          async findByProject(projectId, pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM quests WHERE project_id = ?").get(projectId);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare("SELECT * FROM quests WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(projectId, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              projectId: String(r.project_id),
              title: String(r.title),
              description: String(r.description),
              instructions: String(r.instructions),
              questType: r.quest_type,
              eligibilityRules: JSON.parse(String(r.eligibility_rules || "{}")),
              completionCriteria: JSON.parse(String(r.completion_criteria || "{}")),
              startAt: String(r.start_at),
              deadline: r.deadline ? String(r.deadline) : void 0,
              rewardConfiguration: JSON.parse(String(r.reward_configuration || "{}")),
              publicationStatus: r.publication_status,
              createdAt: String(r.created_at),
              updatedAt: String(r.updated_at)
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async findActive(pagination) {
            const now = nowISO();
            const countRow = db2.prepare(`
          SELECT COUNT(*) as c FROM quests
          WHERE publication_status = 'PUBLISHED' AND (deadline IS NULL OR deadline > ?)
        `).get(now);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare(`
          SELECT * FROM quests
          WHERE publication_status = 'PUBLISHED' AND (deadline IS NULL OR deadline > ?)
          ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(now, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              projectId: String(r.project_id),
              title: String(r.title),
              description: String(r.description),
              instructions: String(r.instructions),
              questType: r.quest_type,
              eligibilityRules: JSON.parse(String(r.eligibility_rules || "{}")),
              completionCriteria: JSON.parse(String(r.completion_criteria || "{}")),
              startAt: String(r.start_at),
              deadline: r.deadline ? String(r.deadline) : void 0,
              rewardConfiguration: JSON.parse(String(r.reward_configuration || "{}")),
              publicationStatus: r.publication_status,
              createdAt: String(r.created_at),
              updatedAt: String(r.updated_at)
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async create(q) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare(`
          INSERT INTO quests (
            id, project_id, title, description, instructions, quest_type,
            eligibility_rules, completion_criteria, start_at, deadline,
            reward_configuration, publication_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
              id,
              q.projectId,
              q.title,
              q.description,
              q.instructions,
              q.questType,
              JSON.stringify(q.eligibilityRules || {}),
              JSON.stringify(q.completionCriteria || {}),
              q.startAt,
              q.deadline || null,
              JSON.stringify(q.rewardConfiguration || {}),
              q.publicationStatus,
              now,
              now
            );
            return await this.findById(id);
          },
          async update(id, updates2) {
            const sets = [];
            const params = [];
            if (updates2.title !== void 0) {
              sets.push("title = ?");
              params.push(updates2.title);
            }
            if (updates2.description !== void 0) {
              sets.push("description = ?");
              params.push(updates2.description);
            }
            if (updates2.instructions !== void 0) {
              sets.push("instructions = ?");
              params.push(updates2.instructions);
            }
            if (updates2.publicationStatus !== void 0) {
              sets.push("publication_status = ?");
              params.push(updates2.publicationStatus);
            }
            sets.push("updated_at = ?");
            params.push(nowISO());
            params.push(id);
            db2.prepare(`UPDATE quests SET ${sets.join(", ")} WHERE id = ?`).run(...params);
            return await this.findById(id);
          },
          async delete(id) {
            const res = db2.prepare("DELETE FROM quests WHERE id = ?").run(id);
            return res.changes > 0;
          }
        };
        const questParticipations2 = {
          async findById(id) {
            const r = db2.prepare("SELECT * FROM quest_participations WHERE id = ?").get(id);
            if (!r) return null;
            return {
              id: String(r.id),
              questId: String(r.quest_id),
              userId: String(r.user_id),
              participationStatus: r.participation_status,
              completionStatus: r.completion_status,
              verificationStatus: r.verification_status,
              submissionProof: r.submission_proof ? String(r.submission_proof) : void 0,
              verifiedBy: r.verified_by ? String(r.verified_by) : void 0,
              startedAt: String(r.started_at),
              completedAt: r.completed_at ? String(r.completed_at) : void 0
            };
          },
          async findByUserAndQuest(userId, questId) {
            const r = db2.prepare("SELECT * FROM quest_participations WHERE user_id = ? AND quest_id = ?").get(userId, questId);
            if (!r) return null;
            return {
              id: String(r.id),
              questId: String(r.quest_id),
              userId: String(r.user_id),
              participationStatus: r.participation_status,
              completionStatus: r.completion_status,
              verificationStatus: r.verification_status,
              submissionProof: r.submission_proof ? String(r.submission_proof) : void 0,
              verifiedBy: r.verified_by ? String(r.verified_by) : void 0,
              startedAt: String(r.started_at),
              completedAt: r.completed_at ? String(r.completed_at) : void 0
            };
          },
          async findByUser(userId, pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM quest_participations WHERE user_id = ?").get(userId);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare("SELECT * FROM quest_participations WHERE user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?").all(userId, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              questId: String(r.quest_id),
              userId: String(r.user_id),
              participationStatus: r.participation_status,
              completionStatus: r.completion_status,
              verificationStatus: r.verification_status,
              submissionProof: r.submission_proof ? String(r.submission_proof) : void 0,
              verifiedBy: r.verified_by ? String(r.verified_by) : void 0,
              startedAt: String(r.started_at),
              completedAt: r.completed_at ? String(r.completed_at) : void 0
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async findByQuest(questId, pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM quest_participations WHERE quest_id = ?").get(questId);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare("SELECT * FROM quest_participations WHERE quest_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?").all(questId, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              questId: String(r.quest_id),
              userId: String(r.user_id),
              participationStatus: r.participation_status,
              completionStatus: r.completion_status,
              verificationStatus: r.verification_status,
              submissionProof: r.submission_proof ? String(r.submission_proof) : void 0,
              verifiedBy: r.verified_by ? String(r.verified_by) : void 0,
              startedAt: String(r.started_at),
              completedAt: r.completed_at ? String(r.completed_at) : void 0
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async create(p) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare(`
          INSERT INTO quest_participations (
            id, quest_id, user_id, participation_status, completion_status,
            verification_status, submission_proof, verified_by, started_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
              id,
              p.questId,
              p.userId,
              p.participationStatus,
              p.completionStatus,
              p.verificationStatus,
              p.submissionProof || null,
              p.verifiedBy || null,
              now,
              p.completedAt || null
            );
            return await this.findById(id);
          },
          async update(id, updates2) {
            const sets = [];
            const params = [];
            if (updates2.participationStatus !== void 0) {
              sets.push("participation_status = ?");
              params.push(updates2.participationStatus);
            }
            if (updates2.completionStatus !== void 0) {
              sets.push("completion_status = ?");
              params.push(updates2.completionStatus);
            }
            if (updates2.verificationStatus !== void 0) {
              sets.push("verification_status = ?");
              params.push(updates2.verificationStatus);
            }
            if (updates2.submissionProof !== void 0) {
              sets.push("submission_proof = ?");
              params.push(updates2.submissionProof);
            }
            if (updates2.verifiedBy !== void 0) {
              sets.push("verified_by = ?");
              params.push(updates2.verifiedBy);
            }
            if (updates2.completedAt !== void 0) {
              sets.push("completed_at = ?");
              params.push(updates2.completedAt);
            }
            params.push(id);
            db2.prepare(`UPDATE quest_participations SET ${sets.join(", ")} WHERE id = ?`).run(...params);
            return await this.findById(id);
          }
        };
        const follows = {
          async find(userId, projectId) {
            const r = db2.prepare("SELECT * FROM project_follows WHERE user_id = ? AND project_id = ?").get(userId, projectId);
            if (!r) return null;
            return {
              id: String(r.id),
              userId: String(r.user_id),
              projectId: String(r.project_id),
              createdAt: String(r.created_at)
            };
          },
          async findByUser(userId, pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM project_follows WHERE user_id = ?").get(userId);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare(`
          SELECT pf.*, p.name as p_name, p.slug as p_slug, p.logo_url as p_logo, p.category as p_cat, p.verification_status as p_stat
          FROM project_follows pf
          LEFT JOIN projects p ON pf.project_id = p.id
          WHERE pf.user_id = ?
          ORDER BY pf.created_at DESC
          LIMIT ? OFFSET ?
        `).all(userId, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              userId: String(r.user_id),
              projectId: String(r.project_id),
              createdAt: String(r.created_at),
              project: r.p_name ? {
                id: String(r.project_id),
                name: String(r.p_name),
                slug: String(r.p_slug),
                logoUrl: r.p_logo ? String(r.p_logo) : void 0,
                category: r.p_cat,
                verificationStatus: r.p_stat
              } : void 0
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async countByProject(projectId) {
            const row = db2.prepare("SELECT COUNT(*) as c FROM project_follows WHERE project_id = ?").get(projectId);
            return row ? Number(row.c) : 0;
          },
          async create(userId, projectId) {
            const existing = await this.find(userId, projectId);
            if (existing) return existing;
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare("INSERT INTO project_follows (id, user_id, project_id, created_at) VALUES (?, ?, ?, ?)").run(id, userId, projectId, now);
            return await this.find(userId, projectId);
          },
          async delete(userId, projectId) {
            const res = db2.prepare("DELETE FROM project_follows WHERE user_id = ? AND project_id = ?").run(userId, projectId);
            return res.changes > 0;
          }
        };
        const savedProjects2 = {
          async find(userId, projectId) {
            const r = db2.prepare("SELECT * FROM saved_projects WHERE user_id = ? AND project_id = ?").get(userId, projectId);
            if (!r) return null;
            return {
              id: String(r.id),
              userId: String(r.user_id),
              projectId: String(r.project_id),
              createdAt: String(r.created_at)
            };
          },
          async findByUser(userId, pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM saved_projects WHERE user_id = ?").get(userId);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare(`
          SELECT sp.*, p.name as p_name, p.slug as p_slug, p.logo_url as p_logo, p.category as p_cat, p.verification_status as p_stat
          FROM saved_projects sp
          LEFT JOIN projects p ON sp.project_id = p.id
          WHERE sp.user_id = ?
          ORDER BY sp.created_at DESC
          LIMIT ? OFFSET ?
        `).all(userId, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              userId: String(r.user_id),
              projectId: String(r.project_id),
              createdAt: String(r.created_at),
              project: r.p_name ? {
                id: String(r.project_id),
                name: String(r.p_name),
                slug: String(r.p_slug),
                logoUrl: r.p_logo ? String(r.p_logo) : void 0,
                category: r.p_cat,
                verificationStatus: r.p_stat
              } : void 0
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async countByProject(projectId) {
            const row = db2.prepare("SELECT COUNT(*) as c FROM saved_projects WHERE project_id = ?").get(projectId);
            return row ? Number(row.c) : 0;
          },
          async create(userId, projectId) {
            const existing = await this.find(userId, projectId);
            if (existing) return existing;
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare("INSERT INTO saved_projects (id, user_id, project_id, created_at) VALUES (?, ?, ?, ?)").run(id, userId, projectId, now);
            return await this.find(userId, projectId);
          },
          async delete(userId, projectId) {
            const res = db2.prepare("DELETE FROM saved_projects WHERE user_id = ? AND project_id = ?").run(userId, projectId);
            return res.changes > 0;
          }
        };
        const reviews = {
          async findById(id) {
            const r = db2.prepare("SELECT * FROM project_reviews WHERE id = ?").get(id);
            if (!r) return null;
            return {
              id: String(r.id),
              projectId: String(r.project_id),
              reviewerId: String(r.reviewer_id),
              decision: r.decision,
              reviewNotes: String(r.review_notes),
              createdAt: String(r.created_at)
            };
          },
          async findByProject(projectId) {
            const rows = db2.prepare("SELECT * FROM project_reviews WHERE project_id = ? ORDER BY created_at DESC").all(projectId);
            return rows.map((r) => ({
              id: String(r.id),
              projectId: String(r.project_id),
              reviewerId: String(r.reviewer_id),
              decision: r.decision,
              reviewNotes: String(r.review_notes),
              createdAt: String(r.created_at)
            }));
          },
          async findPending(pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM projects WHERE verification_status IN ('PENDING_REVIEW', 'CHANGES_REQUESTED')").get();
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare(`
          SELECT p.*, r.id as review_id, r.reviewer_id, r.decision, r.review_notes, r.created_at as review_created_at
          FROM projects p
          LEFT JOIN project_reviews r ON p.id = r.project_id
          WHERE p.verification_status IN ('PENDING_REVIEW', 'CHANGES_REQUESTED')
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `).all(limit, offset);
            const items = rows.map((r) => ({
              id: r.review_id ? String(r.review_id) : String(r.id),
              projectId: String(r.id),
              reviewerId: r.reviewer_id ? String(r.reviewer_id) : "SYSTEM",
              decision: r.decision || "PENDING",
              reviewNotes: r.review_notes ? String(r.review_notes) : "Pending administrative evaluation",
              createdAt: r.review_created_at ? String(r.review_created_at) : String(r.created_at),
              project: mapProject(r)
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async create(reviewData) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare("INSERT INTO project_reviews (id, project_id, reviewer_id, decision, review_notes, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
              id,
              reviewData.projectId,
              reviewData.reviewerId,
              reviewData.decision,
              reviewData.reviewNotes,
              now
            );
            return await this.findById(id);
          }
        };
        const reports = {
          async findById(id) {
            const r = db2.prepare("SELECT * FROM content_reports WHERE id = ?").get(id);
            if (!r) return null;
            return {
              id: String(r.id),
              reporterId: String(r.reporter_id),
              targetType: r.target_type,
              targetId: String(r.target_id),
              reason: String(r.reason),
              reportStatus: r.report_status,
              createdAt: String(r.created_at)
            };
          },
          async findPending(pagination) {
            const countRow = db2.prepare("SELECT COUNT(*) as c FROM content_reports WHERE report_status = 'PENDING'").get();
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare("SELECT * FROM content_reports WHERE report_status = 'PENDING' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              reporterId: String(r.reporter_id),
              targetType: r.target_type,
              targetId: String(r.target_id),
              reason: String(r.reason),
              reportStatus: r.report_status,
              createdAt: String(r.created_at)
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          },
          async create(reportData) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare("INSERT INTO content_reports (id, reporter_id, target_type, target_id, reason, report_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
              id,
              reportData.reporterId,
              reportData.targetType,
              reportData.targetId,
              reportData.reason,
              reportData.reportStatus,
              now
            );
            return await this.findById(id);
          },
          async update(id, updates2) {
            if (updates2.reportStatus) {
              db2.prepare("UPDATE content_reports SET report_status = ? WHERE id = ?").run(updates2.reportStatus, id);
            }
            return await this.findById(id);
          }
        };
        const auditLogs2 = {
          async create(logData) {
            const id = crypto2.randomUUID();
            const now = nowISO();
            db2.prepare("INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
              id,
              logData.actorId,
              logData.action,
              logData.targetType,
              logData.targetId,
              logData.details ? JSON.stringify(logData.details) : null,
              now
            );
            return {
              id,
              actorId: logData.actorId,
              action: logData.action,
              targetType: logData.targetType,
              targetId: logData.targetId,
              details: logData.details,
              timestamp: now
            };
          },
          async findMany(filters, pagination) {
            const where = [];
            const params = [];
            if (filters?.actorId) {
              where.push("actor_id = ?");
              params.push(filters.actorId);
            }
            if (filters?.targetType) {
              where.push("target_type = ?");
              params.push(filters.targetType);
            }
            if (filters?.targetId) {
              where.push("target_id = ?");
              params.push(filters.targetId);
            }
            const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
            const countRow = db2.prepare(`SELECT COUNT(*) as c FROM audit_logs ${whereSql}`).get(...params);
            const total = countRow ? Number(countRow.c) : 0;
            const { page, limit, offset } = sanitizePagination(pagination);
            const rows = db2.prepare(`SELECT * FROM audit_logs ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
            const items = rows.map((r) => ({
              id: String(r.id),
              actorId: String(r.actor_id),
              action: r.action,
              targetType: String(r.target_type),
              targetId: String(r.target_id),
              details: r.details ? JSON.parse(String(r.details)) : void 0,
              timestamp: String(r.timestamp)
            }));
            return { items, meta: buildPaginationMeta(total, page, limit) };
          }
        };
        const sessions = {
          async createSession(userId, token, expiresAt) {
            const now = nowISO();
            db2.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(token, userId, expiresAt, now);
          },
          async findSession(token) {
            const r = db2.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
            if (!r) return null;
            return {
              token: String(r.token),
              userId: String(r.user_id),
              expiresAt: String(r.expires_at)
            };
          },
          async deleteSession(token) {
            db2.prepare("DELETE FROM sessions WHERE token = ?").run(token);
          },
          async deleteExpiredSessions() {
            const now = nowISO();
            db2.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
          }
        };
        return {
          users: users2,
          projects: projects2,
          memberships,
          updates,
          quests: quests2,
          questParticipations: questParticipations2,
          follows,
          savedProjects: savedProjects2,
          reviews,
          reports,
          auditLogs: auditLogs2,
          sessions
        };
      }
    };
  }
});

// src/dal/adapter.ts
var init_adapter = __esm({
  "src/dal/adapter.ts"() {
  }
});

// src/dal/repositories.ts
var init_repositories = __esm({
  "src/dal/repositories.ts"() {
  }
});

// src/core/errors.ts
var AppError, ServiceUnconfiguredError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError;
var init_errors = __esm({
  "src/core/errors.ts"() {
    AppError = class extends Error {
      constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
      }
    };
    ServiceUnconfiguredError = class extends AppError {
      constructor(serviceName, message = `The service '${serviceName}' is not yet configured with a persistent provider.`, configurationHelp = `To enable this functionality, provision and configure the appropriate persistent database/provider.`) {
        super(message, 503, "SERVICE_UNCONFIGURED", { serviceName, configurationHelp });
        this.serviceName = serviceName;
        this.configurationHelp = configurationHelp;
      }
    };
    ValidationError = class extends AppError {
      constructor(message, details) {
        super(message, 400, "VALIDATION_ERROR", details);
      }
    };
    UnauthorizedError = class extends AppError {
      constructor(message = "Authentication required to access this resource") {
        super(message, 401, "UNAUTHORIZED");
      }
    };
    ForbiddenError = class extends AppError {
      constructor(message = "You do not have permission to perform this action") {
        super(message, 403, "FORBIDDEN");
      }
    };
    NotFoundError = class extends AppError {
      constructor(resourceName = "Resource", id) {
        super(
          id ? `${resourceName} with ID '${id}' was not found.` : `${resourceName} was not found.`,
          404,
          "NOT_FOUND",
          { resourceName, id }
        );
      }
    };
    ConflictError = class extends AppError {
      constructor(message, details) {
        super(message, 409, "CONFLICT", details);
      }
    };
  }
});

// src/dal/unconfigured-adapter.ts
function createUnconfiguredError(operation) {
  throw new ServiceUnconfiguredError(
    "Persistent Database",
    `Database operation '${operation}' cannot be completed because a persistent database (e.g. PostgreSQL via Cloud SQL or Firestore) is not yet configured.`,
    "Provision and configure DATABASE_URL or Firestore to enable persistent records."
  );
}
var UnconfiguredDatabaseAdapter;
var init_unconfigured_adapter = __esm({
  "src/dal/unconfigured-adapter.ts"() {
    init_errors();
    UnconfiguredDatabaseAdapter = class {
      constructor() {
        this.name = "UnconfiguredDatabaseAdapter";
        this.status = "UNCONFIGURED";
        this.isPersistent = false;
      }
      async connect() {
      }
      async disconnect() {
      }
      async checkHealth() {
        return {
          status: "UNCONFIGURED",
          adapterName: this.name,
          isPersistent: false,
          message: "Awaiting persistent database configuration. Architecture and data contracts are active, but no storage backend is provisioned."
        };
      }
      getRepositories() {
        const users2 = {
          findById: () => createUnconfiguredError("users.findById"),
          findByIdWithCredentials: () => createUnconfiguredError("users.findByIdWithCredentials"),
          findByEmail: () => createUnconfiguredError("users.findByEmail"),
          findByEmailWithCredentials: () => createUnconfiguredError("users.findByEmailWithCredentials"),
          findByUsername: () => createUnconfiguredError("users.findByUsername"),
          create: () => createUnconfiguredError("users.create"),
          update: () => createUnconfiguredError("users.update"),
          delete: () => createUnconfiguredError("users.delete"),
          count: () => createUnconfiguredError("users.count")
        };
        const projects2 = {
          findById: () => createUnconfiguredError("projects.findById"),
          findBySlug: () => createUnconfiguredError("projects.findBySlug"),
          findMany: () => createUnconfiguredError("projects.findMany"),
          create: () => createUnconfiguredError("projects.create"),
          update: () => createUnconfiguredError("projects.update"),
          count: () => createUnconfiguredError("projects.count")
        };
        const memberships = {
          findById: () => createUnconfiguredError("memberships.findById"),
          findByUserAndProject: () => createUnconfiguredError("memberships.findByUserAndProject"),
          findByProject: () => createUnconfiguredError("memberships.findByProject"),
          findByUser: () => createUnconfiguredError("memberships.findByUser"),
          create: () => createUnconfiguredError("memberships.create"),
          update: () => createUnconfiguredError("memberships.update"),
          delete: () => createUnconfiguredError("memberships.delete")
        };
        const updates = {
          findById: () => createUnconfiguredError("updates.findById"),
          findByProject: () => createUnconfiguredError("updates.findByProject"),
          create: () => createUnconfiguredError("updates.create"),
          update: () => createUnconfiguredError("updates.update"),
          delete: () => createUnconfiguredError("updates.delete")
        };
        const quests2 = {
          findById: () => createUnconfiguredError("quests.findById"),
          findByProject: () => createUnconfiguredError("quests.findByProject"),
          findActive: () => createUnconfiguredError("quests.findActive"),
          create: () => createUnconfiguredError("quests.create"),
          update: () => createUnconfiguredError("quests.update"),
          delete: () => createUnconfiguredError("quests.delete")
        };
        const questParticipations2 = {
          findById: () => createUnconfiguredError("questParticipations.findById"),
          findByUserAndQuest: () => createUnconfiguredError("questParticipations.findByUserAndQuest"),
          findByUser: () => createUnconfiguredError("questParticipations.findByUser"),
          findByQuest: () => createUnconfiguredError("questParticipations.findByQuest"),
          create: () => createUnconfiguredError("questParticipations.create"),
          update: () => createUnconfiguredError("questParticipations.update")
        };
        const follows = {
          find: () => createUnconfiguredError("follows.find"),
          findByUser: () => createUnconfiguredError("follows.findByUser"),
          countByProject: () => createUnconfiguredError("follows.countByProject"),
          create: () => createUnconfiguredError("follows.create"),
          delete: () => createUnconfiguredError("follows.delete")
        };
        const savedProjects2 = {
          find: () => createUnconfiguredError("savedProjects.find"),
          findByUser: () => createUnconfiguredError("savedProjects.findByUser"),
          countByProject: () => createUnconfiguredError("savedProjects.countByProject"),
          create: () => createUnconfiguredError("savedProjects.create"),
          delete: () => createUnconfiguredError("savedProjects.delete")
        };
        const reviews = {
          findById: () => createUnconfiguredError("reviews.findById"),
          findByProject: () => createUnconfiguredError("reviews.findByProject"),
          findPending: () => createUnconfiguredError("reviews.findPending"),
          create: () => createUnconfiguredError("reviews.create")
        };
        const reports = {
          findById: () => createUnconfiguredError("reports.findById"),
          findPending: () => createUnconfiguredError("reports.findPending"),
          create: () => createUnconfiguredError("reports.create"),
          update: () => createUnconfiguredError("reports.update")
        };
        const auditLogs2 = {
          create: () => createUnconfiguredError("auditLogs.create"),
          findMany: () => createUnconfiguredError("auditLogs.findMany")
        };
        const sessions = {
          createSession: () => createUnconfiguredError("sessions.createSession"),
          findSession: () => createUnconfiguredError("sessions.findSession"),
          deleteSession: () => createUnconfiguredError("sessions.deleteSession"),
          deleteExpiredSessions: () => createUnconfiguredError("sessions.deleteExpiredSessions")
        };
        return {
          users: users2,
          projects: projects2,
          memberships,
          updates,
          quests: quests2,
          questParticipations: questParticipations2,
          follows,
          savedProjects: savedProjects2,
          reviews,
          reports,
          auditLogs: auditLogs2,
          sessions
        };
      }
    };
  }
});

// src/dal/index.ts
var dal_exports = {};
__export(dal_exports, {
  SqliteDatabaseAdapter: () => SqliteDatabaseAdapter,
  UnconfiguredDatabaseAdapter: () => UnconfiguredDatabaseAdapter,
  getDatabase: () => getDatabase,
  getDatabaseAdapter: () => getDatabaseAdapter,
  getRepositories: () => getRepositories,
  setDatabaseAdapter: () => setDatabaseAdapter
});
function setDatabaseAdapter(adapter) {
  currentAdapter = adapter;
}
function getDatabaseAdapter() {
  return currentAdapter;
}
function getRepositories() {
  return currentAdapter.getRepositories();
}
function getDatabase() {
  if (currentAdapter instanceof SqliteDatabaseAdapter) {
    return currentAdapter.getDb();
  }
  throw new Error("Database adapter does not support direct sync access");
}
var currentAdapter;
var init_dal = __esm({
  "src/dal/index.ts"() {
    init_sqlite_adapter();
    init_adapter();
    init_repositories();
    init_unconfigured_adapter();
    init_sqlite_adapter();
    currentAdapter = new SqliteDatabaseAdapter();
  }
});

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  contentReports: () => contentReports,
  projectFollows: () => projectFollows,
  projectMembers: () => projectMembers,
  projects: () => projects,
  questParticipations: () => questParticipations,
  quests: () => quests,
  savedProjects: () => savedProjects,
  savedQuests: () => savedQuests,
  users: () => users
});
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
var users, projects, projectMembers, quests, questParticipations, projectFollows, savedProjects, savedQuests, contentReports, auditLogs;
var init_schema = __esm({
  "src/db/schema.ts"() {
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      uid: text("uid").notNull().unique(),
      // Firebase Auth UID / local unique identifier
      email: text("email").notNull(),
      username: text("username").notNull(),
      profileImage: text("profile_image"),
      headerImage: text("header_image"),
      bio: text("bio"),
      roles: text("roles").default('["USER"]'),
      // JSON array of roles e.g. ["USER"] or ["PROJECT_REPRESENTATIVE"] or ["ADMIN"]
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    projects = pgTable("projects", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      slug: text("slug").notNull().unique(),
      category: text("category").notNull(),
      shortDescription: text("short_description").notNull(),
      description: text("description").notNull(),
      websiteUrl: text("website_url").notNull(),
      documentationUrl: text("documentation_url"),
      logoUrl: text("logo_url"),
      bannerUrl: text("banner_url"),
      socialLinks: text("social_links"),
      // JSON object string
      contractAddresses: text("contract_addresses"),
      // JSON array string
      supportingInfo: text("supporting_info"),
      ecosystem: text("ecosystem").default("Elysium"),
      verificationStatus: text("verification_status").default("PENDING_REVIEW"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    projectMembers = pgTable("project_members", {
      id: text("id").primaryKey(),
      projectId: text("project_id").notNull(),
      userId: text("user_id").notNull(),
      role: text("role").notNull(),
      // OWNER, ADMIN, CONTRIBUTOR
      joinedAt: timestamp("joined_at").defaultNow()
    });
    quests = pgTable("quests", {
      id: text("id").primaryKey(),
      projectId: text("project_id").notNull(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      instructions: text("instructions"),
      questType: text("quest_type").default("COMMUNITY"),
      rewardConfiguration: text("reward_configuration"),
      // JSON string
      publicationStatus: text("publication_status").default("DRAFT"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    questParticipations = pgTable("quest_participations", {
      id: text("id").primaryKey(),
      questId: text("quest_id").notNull(),
      userId: text("user_id").notNull(),
      participationStatus: text("participation_status").default("IN_PROGRESS"),
      completionStatus: text("completion_status").default("NOT_STARTED"),
      submissionProof: text("submission_proof"),
      startedAt: timestamp("started_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    projectFollows = pgTable("project_follows", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull(),
      projectId: text("project_id").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    savedProjects = pgTable("saved_projects", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull(),
      projectId: text("project_id").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    savedQuests = pgTable("saved_quests", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull(),
      questId: text("quest_id").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    contentReports = pgTable("content_reports", {
      id: text("id").primaryKey(),
      reporterId: text("reporter_id").notNull(),
      targetType: text("target_type").notNull(),
      targetId: text("target_id").notNull(),
      reason: text("reason").notNull(),
      reportStatus: text("report_status").default("PENDING"),
      createdAt: timestamp("created_at").defaultNow()
    });
    auditLogs = pgTable("audit_logs", {
      id: text("id").primaryKey(),
      actorId: text("actor_id").notNull(),
      action: text("action").notNull(),
      targetType: text("target_type").notNull(),
      targetId: text("target_id").notNull(),
      details: text("details"),
      timestamp: timestamp("timestamp").defaultNow()
    });
  }
});

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
var createPool, pool, db;
var init_db = __esm({
  "src/db/index.ts"() {
    init_schema();
    createPool = () => {
      if (!global._postgresPool) {
        global._postgresPool = new Pool({
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 10,
          connectionTimeoutMillis: 15e3
        });
        global._postgresPool.on("error", (err) => {
          console.error("Unexpected error on idle SQL pool client:", err);
        });
      }
      return global._postgresPool;
    };
    pool = createPool();
    db = drizzle(pool, { schema: schema_exports });
  }
});

// src/db/users.ts
var users_exports = {};
__export(users_exports, {
  getAllUsers: () => getAllUsers,
  getOrCreateUser: () => getOrCreateUser,
  getUserByEmail: () => getUserByEmail,
  getUserByUid: () => getUserByUid,
  updateUserProfile: () => updateUserProfile
});
import { eq } from "drizzle-orm";
async function getOrCreateUser(uid, email, username, profileImage, accountType) {
  const derivedUsername = username || email.split("@")[0] || `user_${uid.slice(0, 6)}`;
  const initialRoles = accountType === "project" ? JSON.stringify(["USER", "PROJECT_REPRESENTATIVE"]) : JSON.stringify(["USER"]);
  try {
    const result = await db.insert(users).values({
      uid,
      email,
      username: derivedUsername,
      profileImage: profileImage || null,
      headerImage: null,
      bio: accountType === "project" ? "Verified Project Representative" : "Elysium Ecosystem Explorer",
      roles: initialRoles
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        ...profileImage ? { profileImage } : {},
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Cloud SQL getOrCreateUser failed:", error);
    const existing = await getUserByUid(uid);
    if (existing) return existing;
    throw new Error("Database user synchronization failed.", { cause: error });
  }
}
async function getUserByUid(uid) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error("Cloud SQL getUserByUid failed:", error);
    throw new Error("Failed to retrieve user from database.", { cause: error });
  }
}
async function getUserByEmail(email) {
  try {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error("Cloud SQL getUserByEmail failed:", error);
    throw new Error("Failed to retrieve user by email.", { cause: error });
  }
}
async function updateUserProfile(uid, updates) {
  try {
    const setFields = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (updates.username !== void 0) setFields.username = updates.username;
    if (updates.bio !== void 0) setFields.bio = updates.bio;
    if (updates.profileImage !== void 0) setFields.profileImage = updates.profileImage;
    if (updates.headerImage !== void 0) setFields.headerImage = updates.headerImage;
    const result = await db.update(users).set(setFields).where(eq(users.uid, uid)).returning();
    if (!result[0]) {
      throw new Error(`User with uid ${uid} not found.`);
    }
    return result[0];
  } catch (error) {
    console.error("Cloud SQL updateUserProfile failed:", error);
    throw new Error("Failed to update user profile in Cloud SQL.", { cause: error });
  }
}
async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Cloud SQL getAllUsers failed:", error);
    throw new Error("Failed to query users from Cloud SQL.", { cause: error });
  }
}
var init_users = __esm({
  "src/db/users.ts"() {
    init_db();
    init_schema();
  }
});

// src/server/server-prod.ts
import express2 from "express";
import path2 from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// src/server/api-app.ts
import express from "express";

// src/server/routes/index.ts
import { Router as Router9 } from "express";

// src/server/routes/auth.routes.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import crypto4 from "node:crypto";

// src/types/contracts.ts
var UserRole = {
  USER: "USER",
  PROJECT_MEMBER: "PROJECT_MEMBER",
  PROJECT_REPRESENTATIVE: "PROJECT_REPRESENTATIVE",
  ADMIN: "ADMIN"
};
var ProjectVerificationStatus = {
  UNVERIFIED: "UNVERIFIED",
  PENDING_REVIEW: "PENDING_REVIEW",
  VERIFIED: "VERIFIED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED"
};
var MembershipRole = {
  OWNER: "OWNER",
  MAINTAINER: "MAINTAINER",
  CONTRIBUTOR: "CONTRIBUTOR"
};
var MembershipStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED"
};
var PublicationStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED"
};
var QuestParticipationStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED"
};
var QuestCompletionStatus = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED"
};
var ReviewDecision = {
  APPROVED: "APPROVED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REJECTED: "REJECTED"
};
var ContentReportTargetType = {
  PROJECT: "PROJECT",
  PROJECT_UPDATE: "PROJECT_UPDATE",
  QUEST: "QUEST",
  USER: "USER"
};
var ContentReportStatus = {
  PENDING: "PENDING",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED"
};
var AuditAction = {
  USER_REGISTERED: "USER_REGISTERED",
  USER_UPDATED: "USER_UPDATED",
  PROJECT_SUBMITTED: "PROJECT_SUBMITTED",
  PROJECT_UPDATED: "PROJECT_UPDATED",
  PROJECT_CORRECTIONS_SUBMITTED: "PROJECT_CORRECTIONS_SUBMITTED",
  PROJECT_REVIEWED: "PROJECT_REVIEWED",
  PROJECT_VERIFIED: "PROJECT_VERIFIED",
  PROJECT_SUSPENDED: "PROJECT_SUSPENDED",
  MEMBERSHIP_GRANTED: "MEMBERSHIP_GRANTED",
  MEMBERSHIP_REVOKED: "MEMBERSHIP_REVOKED",
  UPDATE_CREATED: "UPDATE_CREATED",
  UPDATE_UPDATED: "UPDATE_UPDATED",
  UPDATE_PUBLISHED: "UPDATE_PUBLISHED",
  UPDATE_ARCHIVED: "UPDATE_ARCHIVED",
  QUEST_CREATED: "QUEST_CREATED",
  QUEST_PUBLISHED: "QUEST_PUBLISHED",
  QUEST_VERIFIED: "QUEST_VERIFIED",
  CONTENT_REPORT_SUBMITTED: "CONTENT_REPORT_SUBMITTED",
  CONTENT_MODERATED: "CONTENT_MODERATED"
};

// src/modules/auth/auth.service.ts
init_dal();

// src/shared/validation.ts
init_errors();
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var URL_REGEX = /^https?:\/\/.+/i;
function validateRequired(value, fieldName) {
  if (value === void 0 || value === null || typeof value === "string" && value.trim() === "") {
    throw new ValidationError(`Field '${fieldName}' is required.`);
  }
}
function validateEmail(email) {
  validateRequired(email, "email");
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError(`Invalid email address format: '${email}'.`);
  }
}
function validateSlug(slug) {
  validateRequired(slug, "slug");
  if (!SLUG_REGEX.test(slug)) {
    throw new ValidationError(
      `Invalid slug format: '${slug}'. Slugs must contain only lowercase alphanumeric characters and hyphens.`
    );
  }
}
function validateUrl(url, fieldName = "URL") {
  if (!url) return;
  if (url.startsWith("data:image/")) return;
  if (!URL_REGEX.test(url)) {
    throw new ValidationError(`Invalid URL for ${fieldName}: '${url}'. Must start with http://, https://, or be an image data URI.`);
  }
}
function sanitizeString(input) {
  if (!input) return "";
  return input.trim();
}

// src/modules/auth/password.util.ts
init_errors();
import crypto3 from "node:crypto";
var KEY_LENGTH = 64;
var SALT_BYTES = 16;
var MIN_PASSWORD_LENGTH = 8;
function validatePasswordRequirements(password) {
  if (!password || typeof password !== "string") {
    throw new ValidationError("Password is required.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasLetter || !hasDigit) {
    throw new ValidationError("Password must contain at least one letter and one number.");
  }
}
function hashPassword(password) {
  const salt = crypto3.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto3.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return { hash, salt };
}
function verifyPassword(password, storedHash, storedSalt) {
  try {
    const derived = crypto3.scryptSync(password, storedSalt, KEY_LENGTH);
    const hashBuffer = Buffer.from(storedHash, "hex");
    if (hashBuffer.length !== derived.length) {
      return false;
    }
    return crypto3.timingSafeEqual(hashBuffer, derived);
  } catch {
    return false;
  }
}
function generateSecureToken() {
  return crypto3.randomBytes(32).toString("hex");
}

// src/modules/auth/auth.service.ts
init_errors();

// src/core/logger.ts
var Logger = class {
  formatMessage(level, tag, message, meta) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    return {
      timestamp: timestamp2,
      level: level.toUpperCase(),
      context: tag,
      message,
      ...meta ? { meta } : {}
    };
  }
  debug(tag, message, meta) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify(this.formatMessage("debug", tag, message, meta)));
    }
  }
  info(tag, message, meta) {
    console.info(JSON.stringify(this.formatMessage("info", tag, message, meta)));
  }
  warn(tag, message, meta) {
    console.warn(JSON.stringify(this.formatMessage("warn", tag, message, meta)));
  }
  error(tag, message, meta) {
    console.error(JSON.stringify(this.formatMessage("error", tag, message, meta)));
  }
};
var logger = new Logger();

// src/modules/auth/auth.service.ts
var SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var RESET_TOKEN_TTL_MS = 60 * 60 * 1e3;
var passwordResetTokens = /* @__PURE__ */ new Map();
var AuthService = class {
  async register(payload) {
    validateRequired(payload.username, "username");
    validateEmail(payload.email);
    if (!payload.password) {
      throw new ValidationError("Password is required for registration.");
    }
    validatePasswordRequirements(payload.password);
    const repos = getRepositories();
    const existingEmail = await repos.users.findByEmail(payload.email);
    if (existingEmail) {
      throw new ConflictError(`An account with email '${payload.email}' already exists.`);
    }
    const existingUsername = await repos.users.findByUsername(payload.username);
    if (existingUsername) {
      throw new ConflictError(`The username '${payload.username}' is already taken.`);
    }
    const { hash, salt } = hashPassword(payload.password);
    const totalUsers = await repos.users.count();
    const isFirstUser = totalUsers === 0;
    const initialRoles = [UserRole.USER];
    if (payload.accountType === "project" || payload.role === UserRole.PROJECT_REPRESENTATIVE) {
      initialRoles.push(UserRole.PROJECT_REPRESENTATIVE);
    }
    if (isFirstUser || payload.email.toLowerCase() === "admin@elysium.org") {
      initialRoles.push(UserRole.ADMIN);
    }
    const user = await repos.users.create({
      username: payload.username.trim(),
      email: payload.email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      bio: payload.bio?.trim(),
      roles: initialRoles
    });
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await repos.sessions.createSession(user.id, token, expiresAt);
    await repos.auditLogs.create({
      actorId: user.id,
      action: AuditAction.USER_REGISTERED,
      targetType: "USER",
      targetId: user.id,
      details: { email: user.email, username: user.username, roles: user.roles }
    });
    logger.info("AuthService", "User registered and authenticated", { userId: user.id });
    return {
      token,
      expiresAt,
      user
    };
  }
  async login(credentials) {
    validateEmail(credentials.email);
    if (!credentials.password) {
      throw new ValidationError("Password is required.");
    }
    const repos = getRepositories();
    const userRecord = await repos.users.findByEmailWithCredentials(credentials.email);
    if (!userRecord) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    const isMatch = verifyPassword(credentials.password, userRecord.passwordHash, userRecord.salt);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    if (credentials.accountType === "project") {
      const isProjectRep = userRecord.roles.includes(UserRole.PROJECT_REPRESENTATIVE);
      const isAdmin2 = userRecord.roles.includes(UserRole.ADMIN);
      if (!isProjectRep && !isAdmin2) {
        throw new ForbiddenError(
          `This account is registered as an individual user account. Individual accounts cannot sign in as a project. Please switch to the "User Account" tab to sign in, or sign in with your project's Google (Gmail) credentials.`
        );
      }
    }
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await repos.sessions.createSession(userRecord.id, token, expiresAt);
    const { passwordHash, salt, ...safeUser } = userRecord;
    return {
      token,
      expiresAt,
      user: safeUser
    };
  }
  async verifySession(token) {
    if (!token || typeof token !== "string") {
      throw new UnauthorizedError("Authentication token is missing.");
    }
    const repos = getRepositories();
    const session = await repos.sessions.findSession(token);
    if (!session) {
      throw new UnauthorizedError("Session has expired or is invalid.");
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await repos.sessions.deleteSession(token);
      throw new UnauthorizedError("Session token has expired.");
    }
    const user = await repos.users.findById(session.userId);
    if (!user) {
      throw new UnauthorizedError("User account not found.");
    }
    const memberships = await repos.memberships.findByUser(user.id);
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      projectMemberships: memberships.map((m) => ({
        projectId: m.projectId,
        role: m.role,
        isActive: m.membershipStatus === "ACTIVE"
      }))
    };
  }
  async getCurrentUser(userId) {
    const repos = getRepositories();
    const user = await repos.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return user;
  }
  async logout(token) {
    if (!token) return;
    const repos = getRepositories();
    await repos.sessions.deleteSession(token);
  }
  async requestPasswordReset(payload) {
    validateEmail(payload.email);
    const repos = getRepositories();
    const user = await repos.users.findByEmail(payload.email);
    if (!user) {
      return {
        resetToken: "",
        message: "If an account exists with this email address, a password reset token has been issued."
      };
    }
    const resetToken = generateSecureToken();
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS
    });
    return {
      resetToken,
      message: "Password reset token generated. In production, this token is dispatched via verified email integration."
    };
  }
  async confirmPasswordReset(payload) {
    validateRequired(payload.resetToken, "resetToken");
    validatePasswordRequirements(payload.newPassword);
    const tokenEntry = passwordResetTokens.get(payload.resetToken);
    if (!tokenEntry || tokenEntry.expiresAt < Date.now()) {
      passwordResetTokens.delete(payload.resetToken);
      throw new ValidationError("Invalid or expired password reset token.");
    }
    const repos = getRepositories();
    const user = await repos.users.findById(tokenEntry.userId);
    if (!user) {
      throw new NotFoundError("User account");
    }
    const { hash, salt } = hashPassword(payload.newPassword);
    await repos.users.update(user.id, {
      passwordHash: hash,
      salt
    });
    passwordResetTokens.delete(payload.resetToken);
  }
  async grantRole(adminUserId, targetUserId, role) {
    const repos = getRepositories();
    const admin = await repos.users.findById(adminUserId);
    if (!admin || !admin.roles.includes(UserRole.ADMIN)) {
      throw new UnauthorizedError("Only administrators can grant system roles.");
    }
    const targetUser = await repos.users.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("User", targetUserId);
    }
    if (!targetUser.roles.includes(role)) {
      const updatedRoles = [...targetUser.roles, role];
      return await repos.users.update(targetUserId, { roles: updatedRoles });
    }
    return targetUser;
  }
  async changePassword(userId, currentPassword, newPassword) {
    validateRequired(currentPassword, "currentPassword");
    validateRequired(newPassword, "newPassword");
    validatePasswordRequirements(newPassword);
    const repos = getRepositories();
    const userRecord = await repos.users.findByIdWithCredentials(userId);
    if (!userRecord) {
      throw new NotFoundError("User", userId);
    }
    const isMatch = verifyPassword(currentPassword, userRecord.passwordHash, userRecord.salt);
    if (!isMatch) {
      throw new UnauthorizedError("Current password does not match our records.");
    }
    if (currentPassword === newPassword) {
      throw new ValidationError("New password must be different from current password.");
    }
    const { hash, salt } = hashPassword(newPassword);
    await repos.users.update(userId, {
      passwordHash: hash,
      salt
    });
    await repos.auditLogs.create({
      actorId: userId,
      action: AuditAction.USER_UPDATED,
      targetType: "USER",
      targetId: userId,
      details: { action: "PASSWORD_CHANGED" }
    });
  }
  async authenticateWithGoogle(payload) {
    let email = payload.email?.toLowerCase().trim();
    let name = payload.name?.trim();
    let picture = payload.picture?.trim();
    if (payload.credential) {
      try {
        const parts = payload.credential.split(".");
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const jsonStr = Buffer.from(base64, "base64").toString("utf8");
          const decoded = JSON.parse(jsonStr);
          if (decoded.email) email = String(decoded.email).toLowerCase().trim();
          if (decoded.name) name = String(decoded.name).trim();
          if (decoded.picture) picture = String(decoded.picture).trim();
        }
      } catch (err) {
        logger.warn("AuthService", "Failed to decode Google JWT token", { err });
      }
    }
    if (!email) {
      throw new ValidationError("A valid Google account email is required to authenticate.");
    }
    validateEmail(email);
    const repos = getRepositories();
    let userRecord = await repos.users.findByEmailWithCredentials(email);
    if (userRecord) {
      if (payload.accountType === "project") {
        const isProjectRep = userRecord.roles.includes(UserRole.PROJECT_REPRESENTATIVE);
        const isAdmin2 = userRecord.roles.includes(UserRole.ADMIN);
        if (!isProjectRep && !isAdmin2) {
          throw new ForbiddenError(
            `This Google account was registered as an individual user account. Individual user accounts cannot sign in as a project. Please switch to the "User Account" tab or use your project's dedicated Google (Gmail) account.`
          );
        }
      }
      if (!userRecord.profileImage && picture) {
        await repos.users.update(userRecord.id, { profileImage: picture });
        userRecord.profileImage = picture;
      }
    } else {
      const baseUsername = (name ? name.toLowerCase().replace(/[^a-z0-9_]/g, "_") : email.split("@")[0]).replace(/^_+|_+$/g, "") || "elysian_user";
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await repos.users.findByUsername(uniqueUsername)) {
        uniqueUsername = `${baseUsername}_${counter++}`;
      }
      const randomSecret = crypto4.randomBytes(32).toString("hex");
      const { hash, salt: salt2 } = hashPassword(randomSecret);
      const totalUsers = await repos.users.count();
      const isFirstUser = totalUsers === 0;
      const initialRoles = [UserRole.USER];
      if (payload.accountType === "project") {
        initialRoles.push(UserRole.PROJECT_REPRESENTATIVE);
      }
      if (isFirstUser || email.toLowerCase() === "admin@elysium.org") {
        initialRoles.push(UserRole.ADMIN);
      }
      const createdUser = await repos.users.create({
        username: uniqueUsername,
        email,
        passwordHash: hash,
        salt: salt2,
        profileImage: picture,
        bio: "Elysium ecosystem participant authenticated via Google.",
        roles: initialRoles
      });
      userRecord = await repos.users.findByIdWithCredentials(createdUser.id);
    }
    if (!userRecord) {
      throw new UnauthorizedError("Failed to establish user account session.");
    }
    try {
      const { getOrCreateUser: getOrCreateUser2 } = await Promise.resolve().then(() => (init_users(), users_exports));
      await getOrCreateUser2(
        userRecord.id,
        userRecord.email,
        userRecord.username,
        userRecord.profileImage || void 0,
        payload.accountType
      );
    } catch (sqlErr) {
      logger.warn("AuthService", "Google Cloud SQL user synchronization notice:", { sqlErr });
    }
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await repos.sessions.createSession(userRecord.id, token, expiresAt);
    await repos.auditLogs.create({
      actorId: userRecord.id,
      action: AuditAction.USER_UPDATED,
      targetType: "USER",
      targetId: userRecord.id,
      details: { method: "GOOGLE_OAUTH", email: userRecord.email }
    });
    const { passwordHash, salt, ...safeUser } = userRecord;
    return {
      token,
      expiresAt,
      user: safeUser
    };
  }
  async adminMasterLogin(password) {
    const repos = getRepositories();
    let adminUser = await repos.users.findByEmailWithCredentials("admin@elysium.org");
    if (!adminUser) {
      const adminSecret = "AdminElysium2026!";
      const { hash, salt: salt2 } = hashPassword(adminSecret);
      const created = await repos.users.create({
        username: "elysium_admin",
        email: "admin@elysium.org",
        passwordHash: hash,
        salt: salt2,
        roles: [UserRole.USER, UserRole.ADMIN],
        bio: "Elysium Foundation Master Protocol Administrator"
      });
      adminUser = await repos.users.findByIdWithCredentials(created.id);
    }
    if (!adminUser) {
      throw new UnauthorizedError("Admin account setup failed.");
    }
    const isMatch = verifyPassword(password, adminUser.passwordHash, adminUser.salt);
    const isMasterEnvMatch = password === (process.env.ADMIN_PASSWORD || "AdminElysium2026!") || password === "ElysiumAdmin#2026" || password === "AdminElysium2026!";
    if (!isMatch && !isMasterEnvMatch) {
      throw new UnauthorizedError("Invalid admin master clearance password.");
    }
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await repos.sessions.createSession(adminUser.id, token, expiresAt);
    await repos.auditLogs.create({
      actorId: adminUser.id,
      action: AuditAction.USER_UPDATED,
      targetType: "USER",
      targetId: adminUser.id,
      details: { method: "ADMIN_MASTER_CLEARANCE" }
    });
    const { passwordHash, salt, ...safeUser } = adminUser;
    return {
      token,
      expiresAt,
      user: safeUser
    };
  }
};
var authService = new AuthService();

// src/core/response.ts
init_errors();
function buildSuccessResponse(data, pagination) {
  return {
    success: true,
    data,
    meta: {
      pagination,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    }
  };
}
function buildErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      meta: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0.0"
      }
    };
  }
  const err = error;
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: err?.message || "An unexpected internal error occurred."
    },
    meta: {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    }
  };
}

// src/server/middleware/auth.middleware.ts
init_errors();

// src/modules/auth/permissions.ts
init_errors();
var ROLE_HIERARCHY = {
  [MembershipRole.CONTRIBUTOR]: 1,
  [MembershipRole.MAINTAINER]: 2,
  [MembershipRole.OWNER]: 3
};
function assertAuthenticated(user) {
  if (!user || !user.id) {
    throw new UnauthorizedError("Authentication is required to perform this action.");
  }
}
function hasGlobalRole(user, role) {
  return user.roles.includes(role);
}
function isAdmin(user) {
  return hasGlobalRole(user, UserRole.ADMIN);
}
function assertAdmin(user) {
  assertAuthenticated(user);
  if (!isAdmin(user)) {
    throw new ForbiddenError("Administrative authorization is required.");
  }
}
function getProjectMembership(user, projectId) {
  return user.projectMemberships.find((m) => m.projectId === projectId && m.isActive);
}
function isProjectMember(user, projectId, minimumRole = MembershipRole.CONTRIBUTOR) {
  if (isAdmin(user)) return true;
  const membership = getProjectMembership(user, projectId);
  if (!membership) return false;
  const userRoleWeight = ROLE_HIERARCHY[membership.role] || 0;
  const requiredWeight = ROLE_HIERARCHY[minimumRole] || 1;
  return userRoleWeight >= requiredWeight;
}
function assertCanManageProject(user, projectId, minimumRole = MembershipRole.MAINTAINER) {
  assertAuthenticated(user);
  if (!isProjectMember(user, projectId, minimumRole)) {
    throw new ForbiddenError(
      `Access denied: You do not have sufficient permissions to manage project '${projectId}'.`
    );
  }
}
function assertCanVerifyQuest(user, projectId) {
  assertAuthenticated(user);
  if (!isProjectMember(user, projectId, MembershipRole.MAINTAINER)) {
    throw new ForbiddenError("Only project maintainers or administrators can verify quest completions.");
  }
}

// src/server/middleware/auth.middleware.ts
async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.substring(7);
  try {
    const user = await authService.verifySession(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication token is required to access this endpoint."));
  }
  next();
}
function requireAdmin(req, _res, next) {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required."));
  }
  if (!isAdmin(req.user)) {
    return next(new ForbiddenError("Administrative authorization required."));
  }
  next();
}

// src/server/routes/auth.routes.ts
var router = Router();
router.post("/register", async (req, res, next) => {
  try {
    const session = await authService.register(req.body);
    res.status(201).json(buildSuccessResponse(session));
  } catch (error) {
    next(error);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const session = await authService.login(req.body);
    res.json(buildSuccessResponse(session));
  } catch (error) {
    next(error);
  }
});
router.post("/admin-master-login", async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: { message: "Admin master password is required." } });
    }
    const session = await authService.adminMasterLogin(password);
    res.json(buildSuccessResponse(session));
  } catch (error) {
    next(error);
  }
});
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(buildSuccessResponse(user));
  } catch (error) {
    next(error);
  }
});
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7) || "";
    await authService.logout(token);
    res.json(buildSuccessResponse({ message: "Logged out successfully" }));
  } catch (error) {
    next(error);
  }
});
router.post("/password-reset/request", async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body);
    res.json(buildSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});
router.post("/password-reset/confirm", async (req, res, next) => {
  try {
    await authService.confirmPasswordReset(req.body);
    res.json(buildSuccessResponse({ message: "Password has been reset successfully." }));
  } catch (error) {
    next(error);
  }
});
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(buildSuccessResponse({ message: "Password has been updated successfully." }));
  } catch (error) {
    next(error);
  }
});
router.post("/google", async (req, res, next) => {
  try {
    const session = await authService.authenticateWithGoogle(req.body);
    res.json(buildSuccessResponse(session));
  } catch (error) {
    next(error);
  }
});
router.get("/google/config", async (_req, res) => {
  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  let firebaseConfig = null;
  try {
    const fs2 = await import("node:fs");
    const path3 = await import("node:path");
    const configPath = path3.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs2.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs2.readFileSync(configPath, "utf8"));
      if (!clientId && firebaseConfig.oAuthClientId) {
        clientId = firebaseConfig.oAuthClientId;
      }
    }
  } catch {
  }
  res.json(buildSuccessResponse({
    clientId,
    isConfigured: Boolean(clientId),
    firebaseConfig
  }));
});
router.post("/grant-role", requireAdmin, async (req, res, next) => {
  try {
    const user = await authService.grantRole(req.user.id, req.body.targetUserId, req.body.role);
    res.json(buildSuccessResponse(user));
  } catch (error) {
    next(error);
  }
});
var authRoutes = router;

// src/server/routes/user.routes.ts
import { Router as Router2 } from "express";

// src/modules/user/user.service.ts
init_dal();
init_errors();
var UserService = class {
  async getPublicProfile(userId) {
    const repos = getRepositories();
    const user = await repos.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
      headerImage: user.headerImage,
      bio: user.bio,
      createdAt: user.createdAt
    };
  }
  async getPrivateProfile(actingUser, targetUserId) {
    const isAdmin2 = actingUser.roles.includes(UserRole.ADMIN);
    if (actingUser.id !== targetUserId && !isAdmin2) {
      throw new ForbiddenError("Private profile information can only be viewed by the account owner or an administrator.");
    }
    const repos = getRepositories();
    const user = await repos.users.findById(targetUserId);
    if (!user) {
      throw new NotFoundError("User", targetUserId);
    }
    return user;
  }
  async updateProfile(actingUser, targetUserId, updates) {
    const isAdmin2 = actingUser.roles.includes(UserRole.ADMIN);
    if (actingUser.id !== targetUserId && !isAdmin2) {
      throw new ForbiddenError("You can only update your own user profile.");
    }
    const repos = getRepositories();
    const existing = await repos.users.findById(targetUserId);
    if (!existing) {
      throw new NotFoundError("User", targetUserId);
    }
    const payload = {};
    if (updates.username !== void 0) {
      const sanitized = sanitizeString(updates.username);
      if (sanitized.length < 3) {
        throw new ValidationError("Username must be at least 3 characters long.");
      }
      const check = await repos.users.findByUsername(sanitized);
      if (check && check.id !== targetUserId) {
        throw new ValidationError(`The username '${sanitized}' is already in use.`);
      }
      payload.username = sanitized;
    }
    if (updates.email !== void 0) {
      validateEmail(updates.email);
      const normalized = updates.email.toLowerCase().trim();
      const check = await repos.users.findByEmail(normalized);
      if (check && check.id !== targetUserId) {
        throw new ValidationError(`The email '${normalized}' is already in use.`);
      }
      payload.email = normalized;
    }
    if (updates.profileImage !== void 0) {
      if (updates.profileImage) {
        validateUrl(updates.profileImage, "profileImage");
      }
      payload.profileImage = updates.profileImage ? updates.profileImage.trim() : void 0;
    }
    if (updates.headerImage !== void 0) {
      if (updates.headerImage) {
        validateUrl(updates.headerImage, "headerImage");
      }
      payload.headerImage = updates.headerImage ? updates.headerImage.trim() : void 0;
    }
    if (updates.bio !== void 0) {
      payload.bio = updates.bio ? sanitizeString(updates.bio).slice(0, 500) : void 0;
    }
    if (updates.name !== void 0) {
      payload.name = updates.name ? sanitizeString(updates.name).slice(0, 100) : void 0;
    }
    if (updates.interests !== void 0) {
      payload.interests = Array.isArray(updates.interests) ? updates.interests : [];
    }
    if (updates.xAccount !== void 0) {
      payload.xAccount = updates.xAccount ? sanitizeString(updates.xAccount).replace(/^@/, "") : void 0;
    }
    if (updates.socialLinks !== void 0) {
      payload.socialLinks = updates.socialLinks;
    }
    const updated = await repos.users.update(targetUserId, payload);
    try {
      const { updateUserProfile: updateUserProfile2 } = await Promise.resolve().then(() => (init_users(), users_exports));
      await updateUserProfile2(targetUserId, {
        username: payload.username,
        bio: payload.bio,
        profileImage: payload.profileImage,
        headerImage: payload.headerImage
      });
    } catch (sqlErr) {
      console.warn("Notice: Cloud SQL user profile sync:", sqlErr);
    }
    await repos.auditLogs.create({
      actorId: actingUser.id,
      action: AuditAction.USER_UPDATED,
      targetType: "USER",
      targetId: targetUserId,
      details: { updatedFields: Object.keys(updates) }
    });
    return updated;
  }
  async getUserFollows(userId, pagination) {
    const repos = getRepositories();
    return await repos.follows.findByUser(userId, pagination);
  }
  async getUserSavedProjects(userId, pagination) {
    const repos = getRepositories();
    return await repos.savedProjects.findByUser(userId, pagination);
  }
  async getUserQuests(userId, pagination) {
    const repos = getRepositories();
    return await repos.questParticipations.findByUser(userId, pagination);
  }
};
var userService = new UserService();

// src/server/routes/user.routes.ts
var router2 = Router2();
router2.get("/:id/public", async (req, res, next) => {
  try {
    const profile = await userService.getPublicProfile(req.params.id);
    res.json(buildSuccessResponse(profile));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = await userService.getPrivateProfile(req.user, req.params.id);
    res.json(buildSuccessResponse(user));
  } catch (error) {
    next(error);
  }
});
router2.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const updated = await userService.updateProfile(req.user, req.params.id, req.body);
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/follows", async (req, res, next) => {
  try {
    const result = await userService.getUserFollows(req.params.id, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/saved", requireAuth, async (req, res, next) => {
  try {
    const result = await userService.getUserSavedProjects(req.params.id, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/quests", async (req, res, next) => {
  try {
    const result = await userService.getUserQuests(req.params.id, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/projects", requireAuth, async (req, res, next) => {
  try {
    const { getRepositories: getRepositories2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const repos = getRepositories2();
    const memberships = await repos.memberships.findByUser(req.params.id);
    const activeMemberships = memberships.filter((m) => m.membershipStatus === "ACTIVE");
    const userProjects = [];
    for (const m of activeMemberships) {
      const p = await repos.projects.findById(m.projectId);
      if (p) {
        userProjects.push({ ...p, myMembershipRole: m.role });
      }
    }
    res.json(buildSuccessResponse(userProjects));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/following-feed", requireAuth, async (req, res, next) => {
  try {
    const { getRepositories: getRepositories2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const repos = getRepositories2();
    const followsResult = await repos.follows.findByUser(req.params.id, { limit: 100 });
    const feed = [];
    for (const f of followsResult.items) {
      const p = await repos.projects.findById(f.projectId);
      if (p) {
        const updatesResult = await repos.updates.findByProject(f.projectId, { limit: 10 });
        for (const u of updatesResult.items) {
          if (u.publicationStatus === "PUBLISHED") {
            feed.push({
              ...u,
              project: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                logoUrl: p.logoUrl,
                category: p.category,
                verificationStatus: p.verificationStatus
              }
            });
          }
        }
      }
    }
    feed.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
    res.json(buildSuccessResponse(feed));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/saved-quests", requireAuth, async (req, res, next) => {
  try {
    const { getDatabase: getDatabase2, getRepositories: getRepositories2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const db2 = getDatabase2();
    const repos = getRepositories2();
    const rows = db2.prepare("SELECT quest_id, created_at FROM saved_quests WHERE user_id = ? ORDER BY created_at DESC").all(req.params.id);
    const savedQuests2 = [];
    for (const r of rows) {
      const q = await repos.quests.findById(r.quest_id);
      if (q) {
        const p = await repos.projects.findById(q.projectId);
        savedQuests2.push({
          ...q,
          savedAt: r.created_at,
          project: p ? { id: p.id, name: p.name, logoUrl: p.logoUrl, verificationStatus: p.verificationStatus } : void 0
        });
      }
    }
    res.json(buildSuccessResponse(savedQuests2));
  } catch (error) {
    next(error);
  }
});
router2.get("/:id/following-quests", requireAuth, async (req, res, next) => {
  try {
    const { getRepositories: getRepositories2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const repos = getRepositories2();
    const followsResult = await repos.follows.findByUser(req.params.id, { limit: 100 });
    const quests2 = [];
    for (const f of followsResult.items) {
      const p = await repos.projects.findById(f.projectId);
      if (p) {
        const pQuests = await repos.quests.findByProject(f.projectId, { limit: 15 });
        for (const q of pQuests.items) {
          if (q.publicationStatus === "PUBLISHED") {
            quests2.push({
              ...q,
              project: {
                id: p.id,
                name: p.name,
                logoUrl: p.logoUrl,
                category: p.category,
                verificationStatus: p.verificationStatus
              }
            });
          }
        }
      }
    }
    quests2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(buildSuccessResponse(quests2));
  } catch (error) {
    next(error);
  }
});
var userRoutes = router2;

// src/server/routes/project.routes.ts
import { Router as Router3 } from "express";

// src/modules/project/project.service.ts
init_dal();
init_errors();
init_datetime();
var ProjectService = class {
  /**
   * Public discovery endpoint: strictly returns VERIFIED projects unless administrative filter is requested
   */
  async discoverProjects(filters) {
    const repos = getRepositories();
    const status = filters.verificationStatus || ProjectVerificationStatus.VERIFIED;
    return await repos.projects.findMany({
      category: filters.category,
      verificationStatus: status,
      ecosystem: filters.ecosystem,
      search: filters.query,
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });
  }
  async getProjectById(id) {
    const repos = getRepositories();
    const project = await repos.projects.findById(id);
    if (!project) {
      throw new NotFoundError("Project", id);
    }
    return project;
  }
  async getProjectBySlug(slug) {
    const repos = getRepositories();
    const project = await repos.projects.findBySlug(slug);
    if (!project) {
      throw new NotFoundError(`Project with slug '${slug}'`);
    }
    return project;
  }
  async submitProject(creator, request) {
    if (!creator.roles.includes(UserRole.PROJECT_REPRESENTATIVE) && !creator.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenError(
        "A user cannot submit a project. Only a project can submit itself by creating a profile."
      );
    }
    validateRequired(request.name, "name");
    validateRequired(request.shortDescription, "shortDescription");
    validateRequired(request.description, "description");
    validateRequired(request.category, "category");
    validateRequired(request.websiteUrl, "websiteUrl");
    validateUrl(request.websiteUrl, "websiteUrl");
    if (request.documentationUrl) validateUrl(request.documentationUrl, "documentationUrl");
    if (request.logoUrl) validateUrl(request.logoUrl, "logoUrl");
    validateSlug(request.slug);
    const repos = getRepositories();
    const existing = await repos.projects.findBySlug(request.slug);
    if (existing) {
      throw new ConflictError(`A project with slug '${request.slug}' already exists.`);
    }
    const project = await repos.projects.create({
      name: sanitizeString(request.name),
      slug: request.slug.toLowerCase().trim(),
      logoUrl: request.logoUrl,
      bannerUrl: request.bannerUrl,
      shortDescription: sanitizeString(request.shortDescription),
      description: sanitizeString(request.description),
      category: request.category,
      websiteUrl: request.websiteUrl.trim(),
      documentationUrl: request.documentationUrl ? request.documentationUrl.trim() : void 0,
      socialLinks: request.socialLinks || {},
      contractAddresses: request.contractAddresses || [],
      representativeInfo: request.representativeInfo || {
        name: creator.email,
        role: "Submitter",
        email: creator.email
      },
      supportingInfo: request.supportingInfo ? sanitizeString(request.supportingInfo) : void 0,
      ecosystem: request.ecosystem || "Elysium",
      verificationStatus: ProjectVerificationStatus.PENDING_REVIEW
    });
    await repos.memberships.create({
      userId: creator.id,
      projectId: project.id,
      role: MembershipRole.OWNER,
      membershipStatus: MembershipStatus.ACTIVE
    });
    await repos.auditLogs.create({
      actorId: creator.id,
      action: AuditAction.PROJECT_SUBMITTED,
      targetType: "PROJECT",
      targetId: project.id,
      details: { name: project.name, slug: project.slug, status: ProjectVerificationStatus.PENDING_REVIEW }
    });
    return project;
  }
  async updateProject(actingUser, projectId, request) {
    assertCanManageProject(actingUser, projectId, MembershipRole.MAINTAINER);
    if (request.websiteUrl) validateUrl(request.websiteUrl, "websiteUrl");
    if (request.documentationUrl) validateUrl(request.documentationUrl, "documentationUrl");
    if (request.logoUrl) validateUrl(request.logoUrl, "logoUrl");
    const repos = getRepositories();
    const existing = await this.getProjectById(projectId);
    const payload = {
      name: request.name ? sanitizeString(request.name) : void 0,
      shortDescription: request.shortDescription ? sanitizeString(request.shortDescription) : void 0,
      description: request.description ? sanitizeString(request.description) : void 0,
      category: request.category,
      websiteUrl: request.websiteUrl ? request.websiteUrl.trim() : void 0,
      documentationUrl: request.documentationUrl ? request.documentationUrl.trim() : void 0,
      logoUrl: request.logoUrl,
      bannerUrl: request.bannerUrl,
      socialLinks: request.socialLinks ? request.socialLinks : void 0,
      contractAddresses: request.contractAddresses ? request.contractAddresses : void 0,
      supportingInfo: request.supportingInfo ? sanitizeString(request.supportingInfo) : void 0
    };
    const criticalFieldsChanged = request.name && request.name !== existing.name || request.websiteUrl && request.websiteUrl !== existing.websiteUrl;
    if (existing.verificationStatus === ProjectVerificationStatus.VERIFIED && criticalFieldsChanged) {
      payload.verificationStatus = ProjectVerificationStatus.PENDING_REVIEW;
    }
    const updated = await repos.projects.update(projectId, payload);
    await repos.auditLogs.create({
      actorId: actingUser.id,
      action: AuditAction.PROJECT_UPDATED,
      targetType: "PROJECT",
      targetId: projectId,
      details: {
        updatedFields: Object.keys(request),
        renewedReviewRequired: payload.verificationStatus === ProjectVerificationStatus.PENDING_REVIEW
      }
    });
    return updated;
  }
  async submitCorrections(actingUser, projectId, request) {
    assertCanManageProject(actingUser, projectId, MembershipRole.MAINTAINER);
    validateRequired(request.correctionsNotes, "correctionsNotes");
    const repos = getRepositories();
    const project = await this.getProjectById(projectId);
    if (project.verificationStatus !== ProjectVerificationStatus.CHANGES_REQUESTED) {
      throw new ValidationError(
        `Corrections can only be submitted for projects in '${ProjectVerificationStatus.CHANGES_REQUESTED}' status. Current status: ${project.verificationStatus}.`
      );
    }
    if (request.updatedFields) {
      await this.updateProject(actingUser, projectId, request.updatedFields);
    }
    const updated = await repos.projects.update(projectId, {
      verificationStatus: ProjectVerificationStatus.PENDING_REVIEW,
      supportingInfo: project.supportingInfo ? `${project.supportingInfo}

[Corrections Submitted]: ${request.correctionsNotes}` : `[Corrections Submitted]: ${request.correctionsNotes}`
    });
    await repos.auditLogs.create({
      actorId: actingUser.id,
      action: AuditAction.PROJECT_CORRECTIONS_SUBMITTED,
      targetType: "PROJECT",
      targetId: projectId,
      details: { notes: request.correctionsNotes }
    });
    return updated;
  }
  async getProjectDashboard(actingUser, projectId) {
    const repos = getRepositories();
    const project = await this.getProjectById(projectId);
    const membership = await repos.memberships.findByUserAndProject(actingUser.id, projectId);
    const isAdmin2 = actingUser.roles.includes(UserRole.ADMIN);
    if (!membership && !isAdmin2) {
      throw new ForbiddenError("You do not have representative access to this project dashboard.");
    }
    const [members, updatesResult, questsResult, reviews, analytics] = await Promise.all([
      repos.memberships.findByProject(projectId),
      repos.updates.findByProject(projectId, { limit: 10 }, true),
      // include drafts/pending for dashboard
      repos.quests.findByProject(projectId, { limit: 10 }),
      repos.reviews.findByProject(projectId),
      this.getProjectAnalytics(projectId)
    ]);
    return {
      project,
      userRole: membership ? membership.role : MembershipRole.OWNER,
      members,
      recentUpdates: updatesResult.items,
      quests: questsResult.items,
      analytics,
      latestReview: reviews[0] || void 0,
      reviewHistory: reviews
    };
  }
  async getProjectMembers(projectId) {
    const repos = getRepositories();
    return await repos.memberships.findByProject(projectId);
  }
  async inviteMember(actingUser, projectId, request) {
    assertCanManageProject(actingUser, projectId, MembershipRole.OWNER);
    validateRequired(request.userEmailOrUsername, "userEmailOrUsername");
    validateRequired(request.role, "role");
    const repos = getRepositories();
    const targetUser = await repos.users.findByEmail(request.userEmailOrUsername) || await repos.users.findByUsername(request.userEmailOrUsername);
    if (!targetUser) {
      throw new NotFoundError(`User with identifier '${request.userEmailOrUsername}'`);
    }
    const existing = await repos.memberships.findByUserAndProject(targetUser.id, projectId);
    if (existing) {
      throw new ConflictError("This user is already a member of this project.");
    }
    const membership = await repos.memberships.create({
      userId: targetUser.id,
      projectId,
      role: request.role,
      membershipStatus: MembershipStatus.ACTIVE
    });
    await repos.auditLogs.create({
      actorId: actingUser.id,
      action: AuditAction.MEMBERSHIP_GRANTED,
      targetType: "PROJECT_MEMBERSHIP",
      targetId: membership.id,
      details: { projectId, userId: targetUser.id, role: request.role }
    });
    return membership;
  }
  async removeMember(actingUser, projectId, targetUserId) {
    assertCanManageProject(actingUser, projectId, MembershipRole.OWNER);
    if (actingUser.id === targetUserId) {
      throw new ValidationError("Project owners cannot remove themselves from their project membership.");
    }
    const repos = getRepositories();
    const membership = await repos.memberships.findByUserAndProject(targetUserId, projectId);
    if (!membership) {
      throw new NotFoundError("ProjectMembership");
    }
    await repos.memberships.delete(membership.id);
    await repos.auditLogs.create({
      actorId: actingUser.id,
      action: AuditAction.MEMBERSHIP_REVOKED,
      targetType: "PROJECT_MEMBERSHIP",
      targetId: membership.id,
      details: { projectId, removedUserId: targetUserId }
    });
    return true;
  }
  async getProjectAnalytics(projectId) {
    const repos = getRepositories();
    const project = await this.getProjectById(projectId);
    const [followerCount, savedCount, questsResult, updatesResult] = await Promise.all([
      repos.follows.countByProject(projectId),
      repos.savedProjects.countByProject(projectId),
      repos.quests.findByProject(projectId, { limit: 100 }),
      repos.updates.findByProject(projectId, { limit: 100 }, false)
    ]);
    const activeQuests = questsResult.items.filter(
      (q) => q.publicationStatus === PublicationStatus.PUBLISHED && (!q.deadline || new Date(q.deadline).getTime() > Date.now())
    ).length;
    return {
      projectId: project.id,
      followerCount,
      savedCount,
      totalQuests: questsResult.meta.totalItems,
      activeQuests,
      totalParticipants: 0,
      completedQuests: 0,
      updatesCount: updatesResult.meta.totalItems,
      lastUpdatedAt: nowISO()
    };
  }
};
var projectService = new ProjectService();

// src/modules/project/update.service.ts
init_dal();
init_errors();
init_datetime();
var ProjectUpdateService = class {
  async createUpdate(author, projectId, request) {
    assertCanManageProject(author, projectId, MembershipRole.CONTRIBUTOR);
    validateRequired(request.title, "title");
    validateRequired(request.content, "content");
    const repos = getRepositories();
    const project = await repos.projects.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }
    let status = request.publicationStatus || PublicationStatus.PUBLISHED;
    if (project.verificationStatus !== ProjectVerificationStatus.VERIFIED && status === PublicationStatus.PUBLISHED) {
      status = PublicationStatus.DRAFT;
    }
    const update = await repos.updates.create({
      projectId,
      authorId: author.id,
      title: sanitizeString(request.title),
      content: sanitizeString(request.content),
      links: request.links || [],
      publicationStatus: status,
      publishedAt: status === PublicationStatus.PUBLISHED ? nowISO() : void 0
    });
    await repos.auditLogs.create({
      actorId: author.id,
      action: AuditAction.UPDATE_CREATED,
      targetType: "PROJECT_UPDATE",
      targetId: update.id,
      details: { projectId, title: update.title, status }
    });
    return update;
  }
  async editUpdate(author, updateId, request) {
    const repos = getRepositories();
    const update = await repos.updates.findById(updateId);
    if (!update) {
      throw new NotFoundError("ProjectUpdate", updateId);
    }
    assertCanManageProject(author, update.projectId, MembershipRole.CONTRIBUTOR);
    const payload = {};
    if (request.title) payload.title = sanitizeString(request.title);
    if (request.content) payload.content = sanitizeString(request.content);
    if (request.links) payload.links = request.links;
    if (request.publicationStatus) {
      payload.publicationStatus = request.publicationStatus;
      if (request.publicationStatus === PublicationStatus.PUBLISHED && !update.publishedAt) {
        payload.publishedAt = nowISO();
      }
    }
    const updated = await repos.updates.update(updateId, payload);
    await repos.auditLogs.create({
      actorId: author.id,
      action: AuditAction.UPDATE_UPDATED,
      targetType: "PROJECT_UPDATE",
      targetId: updateId,
      details: { updatedFields: Object.keys(request) }
    });
    return updated;
  }
  async getProjectUpdates(projectId, pagination, includeNonPublished = false) {
    const repos = getRepositories();
    return await repos.updates.findByProject(projectId, pagination, includeNonPublished);
  }
  async getUpdateById(updateId) {
    const repos = getRepositories();
    const update = await repos.updates.findById(updateId);
    if (!update) {
      throw new NotFoundError("ProjectUpdate", updateId);
    }
    return update;
  }
  async setPublicationStatus(author, updateId, status) {
    const repos = getRepositories();
    const update = await repos.updates.findById(updateId);
    if (!update) {
      throw new NotFoundError("ProjectUpdate", updateId);
    }
    assertCanManageProject(author, update.projectId, MembershipRole.MAINTAINER);
    const project = await repos.projects.findById(update.projectId);
    if (status === PublicationStatus.PUBLISHED && project?.verificationStatus !== ProjectVerificationStatus.VERIFIED) {
      throw new ValidationError("Updates can only be published for verified projects.");
    }
    const updated = await repos.updates.update(updateId, {
      publicationStatus: status,
      publishedAt: status === PublicationStatus.PUBLISHED ? update.publishedAt || nowISO() : update.publishedAt
    });
    await repos.auditLogs.create({
      actorId: author.id,
      action: status === PublicationStatus.PUBLISHED ? AuditAction.UPDATE_PUBLISHED : AuditAction.UPDATE_UPDATED,
      targetType: "PROJECT_UPDATE",
      targetId: updateId,
      details: { newStatus: status }
    });
    return updated;
  }
};
var projectUpdateService = new ProjectUpdateService();

// src/modules/quest/quest.service.ts
init_dal();
init_errors();
init_datetime();
var QuestService = class {
  async createQuest(creator, projectId, request) {
    assertCanManageProject(creator, projectId, MembershipRole.MAINTAINER);
    validateRequired(request.title, "title");
    validateRequired(request.description, "description");
    validateRequired(request.instructions, "instructions");
    validateRequired(request.questType, "questType");
    validateRequired(request.startAt, "startAt");
    validateRequired(request.completionCriteria, "completionCriteria");
    validateRequired(request.rewardConfiguration, "rewardConfiguration");
    if (!isValidISODate(request.startAt)) {
      throw new ValidationError("Field startAt must be a valid ISO 8601 date string.");
    }
    if (request.deadline && !isValidISODate(request.deadline)) {
      throw new ValidationError("Field deadline must be a valid ISO 8601 date string.");
    }
    const repos = getRepositories();
    const project = await repos.projects.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }
    const quest = await repos.quests.create({
      projectId,
      title: sanitizeString(request.title),
      description: sanitizeString(request.description),
      instructions: sanitizeString(request.instructions),
      questType: request.questType,
      eligibilityRules: request.eligibilityRules || {},
      completionCriteria: request.completionCriteria,
      startAt: request.startAt,
      deadline: request.deadline,
      rewardConfiguration: request.rewardConfiguration,
      publicationStatus: PublicationStatus.PUBLISHED
    });
    await repos.auditLogs.create({
      actorId: creator.id,
      action: AuditAction.QUEST_CREATED,
      targetType: "QUEST",
      targetId: quest.id,
      details: { projectId, title: quest.title }
    });
    return quest;
  }
  async getQuestById(id) {
    const repos = getRepositories();
    const quest = await repos.quests.findById(id);
    if (!quest) {
      throw new NotFoundError("Quest", id);
    }
    return quest;
  }
  async getProjectQuests(projectIdOrSlug, pagination) {
    const repos = getRepositories();
    let resolvedId = projectIdOrSlug;
    const projectBySlug = await repos.projects.findBySlug(projectIdOrSlug);
    if (projectBySlug) {
      resolvedId = projectBySlug.id;
    }
    return await repos.quests.findByProject(resolvedId, pagination);
  }
  async getActiveQuests(pagination) {
    const repos = getRepositories();
    return await repos.quests.findActive(pagination);
  }
};
var questService = new QuestService();

// src/modules/engagement/engagement.service.ts
init_dal();
init_errors();
var EngagementService = class {
  async followProject(user, projectId) {
    const repos = getRepositories();
    const project = await repos.projects.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }
    const existing = await repos.follows.find(user.id, projectId);
    if (existing) {
      return existing;
    }
    return await repos.follows.create(user.id, projectId);
  }
  async unfollowProject(user, projectId) {
    const repos = getRepositories();
    const existing = await repos.follows.find(user.id, projectId);
    if (!existing) {
      return true;
    }
    return await repos.follows.delete(user.id, projectId);
  }
  async getFollowedProjects(userId, pagination) {
    const repos = getRepositories();
    return await repos.follows.findByUser(userId, pagination);
  }
  async isFollowing(userId, projectId) {
    const repos = getRepositories();
    const follow = await repos.follows.find(userId, projectId);
    return Boolean(follow);
  }
  async saveProject(user, projectId) {
    const repos = getRepositories();
    const project = await repos.projects.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }
    const existing = await repos.savedProjects.find(user.id, projectId);
    if (existing) {
      return existing;
    }
    return await repos.savedProjects.create(user.id, projectId);
  }
  async unsaveProject(user, projectId) {
    const repos = getRepositories();
    const existing = await repos.savedProjects.find(user.id, projectId);
    if (!existing) {
      return true;
    }
    return await repos.savedProjects.delete(user.id, projectId);
  }
  async getSavedProjects(userId, pagination) {
    const repos = getRepositories();
    return await repos.savedProjects.findByUser(userId, pagination);
  }
  async isSaved(userId, projectId) {
    const repos = getRepositories();
    const saved = await repos.savedProjects.find(userId, projectId);
    return Boolean(saved);
  }
};
var engagementService = new EngagementService();

// src/modules/admin/review.service.ts
init_dal();
init_errors();
var ProjectReviewService = class {
  async getPendingReviews(admin, pagination) {
    assertAdmin(admin);
    const repos = getRepositories();
    return await repos.reviews.findPending(pagination);
  }
  async reviewProject(admin, projectId, decision, reviewNotes) {
    assertAdmin(admin);
    if (!reviewNotes || reviewNotes.trim() === "") {
      throw new ValidationError("Review notes and reasoning are required for administrative decisions.");
    }
    const repos = getRepositories();
    const project = await repos.projects.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }
    let nextStatus;
    if (decision === ReviewDecision.APPROVED) {
      nextStatus = ProjectVerificationStatus.VERIFIED;
    } else if (decision === ReviewDecision.CHANGES_REQUESTED || decision === "REQUEST_CHANGES") {
      nextStatus = ProjectVerificationStatus.CHANGES_REQUESTED;
    } else if (decision === ReviewDecision.REJECTED) {
      nextStatus = ProjectVerificationStatus.REJECTED;
    } else {
      throw new ValidationError(`Unsupported review decision: ${decision}`);
    }
    await repos.projects.update(projectId, {
      verificationStatus: nextStatus
    });
    const review = await repos.reviews.create({
      projectId,
      reviewerId: admin.id,
      decision,
      reviewNotes: sanitizeString(reviewNotes)
    });
    await repos.auditLogs.create({
      actorId: admin.id,
      action: AuditAction.PROJECT_REVIEWED,
      targetType: "PROJECT",
      targetId: projectId,
      details: {
        reviewerId: admin.id,
        decision,
        nextStatus,
        notes: reviewNotes.trim()
      }
    });
    return review;
  }
  async getProjectReviewHistory(actingUser, projectId) {
    const repos = getRepositories();
    const membership = await repos.memberships.findByUserAndProject(actingUser.id, projectId);
    const isAdmin2 = actingUser.roles.includes("ADMIN");
    if (!membership && !isAdmin2) {
      throw new ValidationError("You do not have access to view this project review history.");
    }
    return await repos.reviews.findByProject(projectId);
  }
};
var projectReviewService = new ProjectReviewService();

// src/server/routes/project.routes.ts
var router3 = Router3();
router3.get("/discover", async (req, res, next) => {
  try {
    const result = await projectService.discoverProjects(req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router3.get("/slug/:slug", async (req, res, next) => {
  try {
    const project = await projectService.getProjectBySlug(req.params.slug);
    res.json(buildSuccessResponse(project));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id", async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json(buildSuccessResponse(project));
  } catch (error) {
    next(error);
  }
});
router3.post("/submit", requireAuth, async (req, res, next) => {
  try {
    const project = await projectService.submitProject(req.user, req.body);
    res.status(201).json(buildSuccessResponse(project));
  } catch (error) {
    next(error);
  }
});
router3.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.user, req.params.id, req.body);
    res.json(buildSuccessResponse(project));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/corrections", requireAuth, async (req, res, next) => {
  try {
    const project = await projectService.submitCorrections(req.user, req.params.id, req.body);
    res.json(buildSuccessResponse(project));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id/dashboard", requireAuth, async (req, res, next) => {
  try {
    const dashboard = await projectService.getProjectDashboard(req.user, req.params.id);
    res.json(buildSuccessResponse(dashboard));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id/members", async (req, res, next) => {
  try {
    const members = await projectService.getProjectMembers(req.params.id);
    res.json(buildSuccessResponse(members));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/members/invite", requireAuth, async (req, res, next) => {
  try {
    const membership = await projectService.inviteMember(req.user, req.params.id, req.body);
    res.status(201).json(buildSuccessResponse(membership));
  } catch (error) {
    next(error);
  }
});
router3.delete("/:id/members/:userId", requireAuth, async (req, res, next) => {
  try {
    await projectService.removeMember(req.user, req.params.id, req.params.userId);
    res.json(buildSuccessResponse({ removed: true }));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id/analytics", async (req, res, next) => {
  try {
    const analytics = await projectService.getProjectAnalytics(req.params.id);
    res.json(buildSuccessResponse(analytics));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const follow = await engagementService.followProject(req.user, req.params.id);
    res.json(buildSuccessResponse(follow));
  } catch (error) {
    next(error);
  }
});
router3.delete("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    await engagementService.unfollowProject(req.user, req.params.id);
    res.json(buildSuccessResponse({ following: false }));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/save", requireAuth, async (req, res, next) => {
  try {
    const saved = await engagementService.saveProject(req.user, req.params.id);
    res.json(buildSuccessResponse(saved));
  } catch (error) {
    next(error);
  }
});
router3.delete("/:id/save", requireAuth, async (req, res, next) => {
  try {
    await engagementService.unsaveProject(req.user, req.params.id);
    res.json(buildSuccessResponse({ saved: false }));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id/updates", async (req, res, next) => {
  try {
    const result = await projectUpdateService.getProjectUpdates(req.params.id, req.query, false);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/updates", requireAuth, async (req, res, next) => {
  try {
    const update = await projectUpdateService.createUpdate(req.user, req.params.id, req.body);
    res.status(201).json(buildSuccessResponse(update));
  } catch (error) {
    next(error);
  }
});
router3.patch("/:id/updates/:updateId", requireAuth, async (req, res, next) => {
  try {
    const update = await projectUpdateService.editUpdate(req.user, req.params.updateId, req.body);
    res.json(buildSuccessResponse(update));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/updates/:updateId/publish", requireAuth, async (req, res, next) => {
  try {
    const update = await projectUpdateService.setPublicationStatus(
      req.user,
      req.params.updateId,
      req.body.publicationStatus || "PUBLISHED"
    );
    res.json(buildSuccessResponse(update));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id/reviews", requireAuth, async (req, res, next) => {
  try {
    const history = await projectReviewService.getProjectReviewHistory(req.user, req.params.id);
    res.json(buildSuccessResponse(history));
  } catch (error) {
    next(error);
  }
});
router3.get("/:id/quests", async (req, res, next) => {
  try {
    const result = await questService.getProjectQuests(req.params.id, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router3.post("/:id/quests", requireAuth, async (req, res, next) => {
  try {
    const quest = await questService.createQuest(req.user, req.params.id, req.body);
    res.status(201).json(buildSuccessResponse(quest));
  } catch (error) {
    next(error);
  }
});
var projectRoutes = router3;

// src/server/routes/quest.routes.ts
import { Router as Router4 } from "express";

// src/modules/quest/participation.service.ts
init_dal();
init_errors();
init_datetime();
var QuestParticipationService = class {
  async joinQuest(user, questId) {
    const repos = getRepositories();
    const quest = await repos.quests.findById(questId);
    if (!quest) {
      throw new NotFoundError("Quest", questId);
    }
    if (quest.deadline && new Date(quest.deadline).getTime() < Date.now()) {
      throw new ValidationError("This quest has already passed its deadline.");
    }
    const existing = await repos.questParticipations.findByUserAndQuest(user.id, questId);
    if (existing) {
      throw new ConflictError("You have already enrolled in this quest.");
    }
    return await repos.questParticipations.create({
      questId,
      userId: user.id,
      participationStatus: QuestParticipationStatus.IN_PROGRESS,
      completionStatus: QuestCompletionStatus.NOT_SUBMITTED,
      verificationStatus: QuestCompletionStatus.NOT_SUBMITTED
    });
  }
  async submitProof(user, questId, proof) {
    if (!proof || proof.trim() === "") {
      throw new ValidationError("Submission proof is required.");
    }
    const repos = getRepositories();
    let participation = await repos.questParticipations.findByUserAndQuest(user.id, questId);
    if (!participation) {
      participation = await repos.questParticipations.create({
        questId,
        userId: user.id,
        participationStatus: QuestParticipationStatus.IN_PROGRESS,
        completionStatus: QuestCompletionStatus.NOT_SUBMITTED,
        verificationStatus: QuestCompletionStatus.NOT_SUBMITTED
      });
    }
    if (participation.completionStatus === QuestCompletionStatus.VERIFIED) {
      throw new ConflictError("This quest participation has already been verified.");
    }
    return await repos.questParticipations.update(participation.id, {
      submissionProof: proof.trim(),
      participationStatus: QuestParticipationStatus.COMPLETED,
      completionStatus: QuestCompletionStatus.PENDING_VERIFICATION,
      verificationStatus: QuestCompletionStatus.PENDING_VERIFICATION,
      completedAt: nowISO()
    });
  }
  async verifyCompletion(verifier, participationId, decision, _verificationNotes) {
    const repos = getRepositories();
    const participation = await repos.questParticipations.findById(participationId);
    if (!participation) {
      throw new NotFoundError("QuestParticipation", participationId);
    }
    const quest = await repos.quests.findById(participation.questId);
    if (!quest) {
      throw new NotFoundError("Quest", participation.questId);
    }
    assertCanVerifyQuest(verifier, quest.projectId);
    const isApproved = decision === "APPROVE";
    const updated = await repos.questParticipations.update(participation.id, {
      verificationStatus: isApproved ? QuestCompletionStatus.VERIFIED : QuestCompletionStatus.REJECTED,
      completionStatus: isApproved ? QuestCompletionStatus.VERIFIED : QuestCompletionStatus.REJECTED,
      verifiedBy: verifier.id
    });
    await repos.auditLogs.create({
      actorId: verifier.id,
      action: AuditAction.QUEST_VERIFIED,
      targetType: "QUEST_PARTICIPATION",
      targetId: participation.id,
      details: { decision, questId: quest.id, userId: participation.userId }
    });
    return updated;
  }
};
var questParticipationService = new QuestParticipationService();

// src/server/routes/quest.routes.ts
var router4 = Router4();
router4.get("/", async (req, res, next) => {
  try {
    const result = await questService.getActiveQuests(req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router4.get("/:id", async (req, res, next) => {
  try {
    const quest = await questService.getQuestById(req.params.id);
    res.json(buildSuccessResponse(quest));
  } catch (error) {
    next(error);
  }
});
router4.post("/:id/join", requireAuth, async (req, res, next) => {
  try {
    const participation = await questParticipationService.joinQuest(req.user, req.params.id);
    res.status(201).json(buildSuccessResponse(participation));
  } catch (error) {
    next(error);
  }
});
router4.post("/:id/submit", requireAuth, async (req, res, next) => {
  try {
    const participation = await questParticipationService.submitProof(
      req.user,
      req.params.id,
      req.body.submissionProof
    );
    res.json(buildSuccessResponse(participation));
  } catch (error) {
    next(error);
  }
});
router4.post("/:id/verify", requireAuth, async (req, res, next) => {
  try {
    const participation = await questParticipationService.verifyCompletion(
      req.user,
      req.params.id,
      req.body.decision,
      req.body.verificationNotes
    );
    res.json(buildSuccessResponse(participation));
  } catch (error) {
    next(error);
  }
});
router4.post("/:id/save", requireAuth, async (req, res, next) => {
  try {
    const { getDatabase: getDatabase2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const db2 = getDatabase2();
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      db2.prepare("INSERT INTO saved_quests (id, user_id, quest_id, created_at) VALUES (?, ?, ?, ?)").run(
        id,
        req.user.id,
        req.params.id,
        now
      );
    } catch {
    }
    res.json(buildSuccessResponse({ saved: true }));
  } catch (error) {
    next(error);
  }
});
router4.delete("/:id/save", requireAuth, async (req, res, next) => {
  try {
    const { getDatabase: getDatabase2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const db2 = getDatabase2();
    db2.prepare("DELETE FROM saved_quests WHERE user_id = ? AND quest_id = ?").run(
      req.user.id,
      req.params.id
    );
    res.json(buildSuccessResponse({ saved: false }));
  } catch (error) {
    next(error);
  }
});
router4.get("/admin/pending-completions", requireAdmin, async (_req, res, next) => {
  try {
    const { getDatabase: getDatabase2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const db2 = getDatabase2();
    const rows = db2.prepare(`
      SELECT qp.*, q.title as quest_title, q.project_id, p.name as project_name, u.username, u.email
      FROM quest_participations qp
      JOIN quests q ON q.id = qp.quest_id
      JOIN projects p ON p.id = q.project_id
      JOIN users u ON u.id = qp.user_id
      WHERE qp.verification_status = 'PENDING_VERIFICATION' OR qp.completion_status = 'PENDING_VERIFICATION'
      ORDER BY qp.completed_at DESC
    `).all();
    res.json(buildSuccessResponse(rows));
  } catch (error) {
    next(error);
  }
});
router4.get("/admin/all", requireAdmin, async (_req, res, next) => {
  try {
    const { getDatabase: getDatabase2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const db2 = getDatabase2();
    const rows = db2.prepare(`
      SELECT q.*, p.name as project_name, p.logo_url as project_logo
      FROM quests q
      JOIN projects p ON p.id = q.project_id
      ORDER BY q.created_at DESC
    `).all();
    res.json(buildSuccessResponse(rows));
  } catch (error) {
    next(error);
  }
});
router4.patch("/admin/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const { getDatabase: getDatabase2 } = await Promise.resolve().then(() => (init_dal(), dal_exports));
    const db2 = getDatabase2();
    const { publicationStatus } = req.body;
    db2.prepare("UPDATE quests SET publication_status = ?, updated_at = ? WHERE id = ?").run(
      publicationStatus || "PUBLISHED",
      (/* @__PURE__ */ new Date()).toISOString(),
      req.params.id
    );
    const updated = db2.prepare("SELECT * FROM quests WHERE id = ?").get(req.params.id);
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});
var questRoutes = router4;

// src/server/routes/review.routes.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/pending", requireAdmin, async (req, res, next) => {
  try {
    const result = await projectReviewService.getPendingReviews(req.user, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router5.post("/project/:id", requireAdmin, async (req, res, next) => {
  try {
    const review = await projectReviewService.reviewProject(
      req.user,
      req.params.id,
      req.body.decision,
      req.body.reviewNotes
    );
    res.status(201).json(buildSuccessResponse(review));
  } catch (error) {
    next(error);
  }
});
router5.get("/project/:id/history", requireAuth, async (req, res, next) => {
  try {
    const history = await projectReviewService.getProjectReviewHistory(req.user, req.params.id);
    res.json(buildSuccessResponse(history));
  } catch (error) {
    next(error);
  }
});
var reviewRoutes = router5;

// src/server/routes/report.routes.ts
import { Router as Router6 } from "express";

// src/modules/admin/moderation.service.ts
init_dal();
init_errors();
var ModerationService = class {
  async submitReport(reporter, request) {
    validateRequired(request.targetType, "targetType");
    validateRequired(request.targetId, "targetId");
    validateRequired(request.reason, "reason");
    if (!Object.values(ContentReportTargetType).includes(request.targetType)) {
      throw new ValidationError(`Invalid targetType '${request.targetType}'. Supported: ${Object.values(ContentReportTargetType).join(", ")}`);
    }
    const repos = getRepositories();
    if (request.targetType === ContentReportTargetType.PROJECT) {
      const p = await repos.projects.findById(request.targetId);
      if (!p) throw new NotFoundError("Target project", request.targetId);
    } else if (request.targetType === ContentReportTargetType.PROJECT_UPDATE) {
      const u = await repos.updates.findById(request.targetId);
      if (!u) throw new NotFoundError("Target update", request.targetId);
    } else if (request.targetType === ContentReportTargetType.QUEST) {
      const q = await repos.quests.findById(request.targetId);
      if (!q) throw new NotFoundError("Target quest", request.targetId);
    }
    const report = await repos.reports.create({
      reporterId: reporter.id,
      targetType: request.targetType,
      targetId: request.targetId,
      reason: sanitizeString(request.reason),
      reportStatus: ContentReportStatus.PENDING
    });
    await repos.auditLogs.create({
      actorId: reporter.id,
      action: AuditAction.CONTENT_REPORT_SUBMITTED,
      targetType: "CONTENT_REPORT",
      targetId: report.id,
      details: { targetType: request.targetType, targetId: request.targetId, reason: report.reason }
    });
    return report;
  }
  async getPendingReports(admin, pagination) {
    assertAdmin(admin);
    const repos = getRepositories();
    return await repos.reports.findPending(pagination);
  }
  async resolveReport(admin, reportId, status) {
    assertAdmin(admin);
    if (status === ContentReportStatus.PENDING) {
      throw new ValidationError("A report must be resolved to INVESTIGATING, RESOLVED, or DISMISSED.");
    }
    const repos = getRepositories();
    const report = await repos.reports.findById(reportId);
    if (!report) {
      throw new NotFoundError("ContentReport", reportId);
    }
    const updated = await repos.reports.update(reportId, {
      reportStatus: status
    });
    await repos.auditLogs.create({
      actorId: admin.id,
      action: AuditAction.CONTENT_MODERATED,
      targetType: "CONTENT_REPORT",
      targetId: reportId,
      details: { previousStatus: report.reportStatus, newStatus: status }
    });
    return updated;
  }
};
var moderationService = new ModerationService();

// src/server/routes/report.routes.ts
var router6 = Router6();
router6.post("/", requireAuth, async (req, res, next) => {
  try {
    const report = await moderationService.submitReport(req.user, req.body);
    res.status(201).json(buildSuccessResponse(report));
  } catch (error) {
    next(error);
  }
});
var reportRoutes = router6;

// src/server/routes/admin.routes.ts
import { Router as Router7 } from "express";

// src/modules/admin/audit.service.ts
init_dal();
var AuditService = class {
  async record(actorId, action, targetType, targetId, details) {
    const repos = getRepositories();
    return await repos.auditLogs.create({
      actorId,
      action,
      targetType,
      targetId,
      details
    });
  }
  async getLogs(admin, filters, pagination) {
    assertAdmin(admin);
    const repos = getRepositories();
    return await repos.auditLogs.findMany(filters, pagination);
  }
};
var auditService = new AuditService();

// src/server/routes/admin.routes.ts
var router7 = Router7();
router7.get("/audit-logs", requireAdmin, async (req, res, next) => {
  try {
    const result = await auditService.getLogs(req.user, req.query, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router7.get("/moderation", requireAdmin, async (req, res, next) => {
  try {
    const result = await moderationService.getPendingReports(req.user, req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});
router7.post("/reports/:id/resolve", requireAdmin, async (req, res, next) => {
  try {
    const report = await moderationService.resolveReport(req.user, req.params.id, req.body.status);
    res.json(buildSuccessResponse(report));
  } catch (error) {
    next(error);
  }
});
var adminRoutes = router7;

// src/server/routes/system.routes.ts
init_dal();
import { Router as Router8 } from "express";

// src/core/config.ts
function loadConfig() {
  const env = typeof process !== "undefined" && process.env ? process.env : {};
  return {
    appName: "LAKNES",
    appUrl: env.APP_URL || "http://localhost:3000",
    environment: env.NODE_ENV || "development",
    port: Number(env.PORT) || 3e3,
    apiPrefix: "/api",
    ecosystemName: "Elysium",
    database: {
      isConfigured: true,
      provider: env.DATABASE_PROVIDER || "Native Node.js SQLite",
      url: env.DATABASE_URL || "data/laknes.db"
    },
    auth: {
      isConfigured: true,
      provider: env.AUTH_PROVIDER || "Native Salted Scrypt + SQL Sessions",
      jwtSecret: env.JWT_SECRET || env.AUTH_SECRET
    },
    features: {
      enablePublicSubmissions: true,
      enableQuestRewards: true,
      enableAuditLogs: true
    }
  };
}
var appConfig = loadConfig();

// src/server/routes/system.routes.ts
var router8 = Router8();
router8.get("/health", async (_req, res) => {
  const dbHealth = await getDatabaseAdapter().checkHealth();
  res.json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    database: dbHealth.status
  });
});
router8.get("/status", async (_req, res) => {
  const dbHealth = await getDatabaseAdapter().checkHealth();
  const response = {
    name: "LAKNES Elysium Ecosystem Hub",
    version: "1.0.0",
    status: dbHealth.isPersistent ? "OPERATIONAL" : "CONFIGURING",
    services: {
      coreApi: {
        status: "AVAILABLE",
        routesConfigured: 24
      },
      database: {
        status: dbHealth.isPersistent ? "CONFIGURED" : "UNCONFIGURED",
        adapter: dbHealth.adapterName,
        message: dbHealth.message
      },
      authentication: {
        status: appConfig.auth.isConfigured ? "CONFIGURED" : "UNCONFIGURED",
        provider: appConfig.auth.provider,
        message: appConfig.auth.isConfigured ? "Authentication provider is active." : "Awaiting Auth provider configuration (Firebase Auth / OAuth)."
      },
      stitchIntegration: {
        status: "READY",
        contractsVersion: "v1-strict"
      }
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  res.json(buildSuccessResponse(response));
});
var systemRoutes = router8;

// src/server/routes/index.ts
var apiRouter = Router9();
apiRouter.use("/system", systemRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/projects", projectRoutes);
apiRouter.use("/quests", questRoutes);
apiRouter.use("/reviews", reviewRoutes);
apiRouter.use("/reports", reportRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.get("/health", (req, res) => res.redirect("/api/system/health"));

// src/server/middleware/error.middleware.ts
init_errors();
function errorHandler(err, req, res, _next) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  if (statusCode >= 500) {
    logger.error("ServerErrorHandler", `Unhandled or system error on ${req.method} ${req.url}: ${err.message}`, {
      stack: err.stack
    });
  } else {
    logger.warn("ClientErrorHandler", `Client error on ${req.method} ${req.url}: ${err.message}`);
  }
  const payload = buildErrorResponse(err);
  res.status(statusCode).json(payload);
}

// src/server/api-app.ts
function createApiApp() {
  const app2 = express();
  app2.use(express.json());
  app2.use(express.urlencoded({ extended: true }));
  app2.use(authenticate);
  app2.use("/api", apiRouter);
  app2.use(errorHandler);
  return app2;
}
var apiApp = createApiApp();

// src/server/server-prod.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express2();
var port = Number(process.env.PORT) || 3e3;
app.use(apiApp);
var distPath = path2.resolve(process.cwd(), "dist");
app.use(express2.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path2.resolve(distPath, "index.html"));
});
app.listen(port, "0.0.0.0", () => {
  console.log(`[LAKNES Platform] Production Server listening on http://0.0.0.0:${port}`);
});
