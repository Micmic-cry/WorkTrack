import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { User } from "./models/User";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log('Attempting login for:', username);
      try {
        const user = await User.findOne({ username });
        if (!user) {
          console.log('User not found');
          return done(null, false, { message: "Invalid username or password" });
        }
        console.log('User found:', user.username);
        const valid = await bcrypt.compare(password, user.password);
        console.log('Password match:', valid);
        if (!valid) return done(null, false, { message: "Invalid username or password" });
        console.log("Logged in user:", user);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).lean();
      if (!user) return done(null, false);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email, role = "Staff", status = "Active" } = req.body;
      if (await User.findOne({ username })) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (await User.findOne({ email })) {
        return res.status(400).json({ error: "Email already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        role,
        status
      });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userObj } = user.toObject();
        res.status(201).json(userObj);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const userObj = user.toObject ? user.toObject() : user;
        const { password, ...rest } = userObj;
        res.json(rest);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (req.user) {
      req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "No user session to log out" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userObj = req.user.toObject ? req.user.toObject() : req.user;
    const { password, ...rest } = userObj;
    res.json(rest);
  });

  app.get("/api/check-admin", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = req.user;
    const isAdmin = user.role === "Admin";
    if (isAdmin) {
      setLocation("/admin");
    }
    res.json({ isAdmin });
  });
}