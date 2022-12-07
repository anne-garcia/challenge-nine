import express from 'express';
import crypto from 'crypto';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

const passwordSaltIterations = 310000;
const passwordByteLength = 32;
const passwordDigest = 'sha256'; // No idea what this is.

export function AuthRouter(mod_db, io) {

    // We create and return this object that contains all the routes we set up right here, hence using "router.get" and not "app.get".
    // Let's us segreagate route code into different files based on type.
    const router = express.Router();

    // Setup session middleware
    const sessionMiddleware = session({
        secret: "uxv343GuXMk4", // Random right now, change later
        resave: false, // Session only saved once, then make a new cookie
        saveUninitialized: false
    });

    router.use(sessionMiddleware)

    // ? Not required?
    router.use(passport.initialize());
    // Tells passport to look for session information in express
    router.use(passport.authenticate('session'));

    // Placement is key, "next" points to routes that comes after this in the module/file.
    // We're just checking if we have user data from the session, and if we do, passing it along to the varous routes that follow.
    router.use((req, res, next) => {
        if(req.user) {
            res.locals.user = req.user;
        }
        next();
    });

    // This will get called every time the login form is submitted, which is where the verify params will come from.
    passport.use(
        new LocalStrategy(
            // Verification
            async (username, password, callback) => {
                // console.log(`Passport verification, username <${username}>, password <${password}>`);

                // Find user in database
                const foundUser = await mod_db.GetUser(username).catch(err => {
                    if(err) {
                        return callback("Username could not be found in database", null);
                    }
                });

                // Even if we don't get an error, we might still just get no user found.
                if(!foundUser) {
                    return callback("Username could not be found in database", null);
                }

                // Generate password hash
                // Need to be put in promise, or was firing after main function already finished.
                const passCorrect = await new Promise((resolve, reject) => {
                    crypto.pbkdf2(password, foundUser.salt, passwordSaltIterations, passwordByteLength, passwordDigest, (err, hashPass) => {
                        const hashPassHexStr = hashPass.toString('hex');
                        // console.log(`Comparing passwords, foundUser.password <${foundUser.password}>, hashPass <${hashPassHexStr}>, match <${foundUser.password === hashPassHexStr}>`);
                        
                        // Compare generated hash to found user's hash.
                        resolve(foundUser.password === hashPassHexStr);
                    });
                });

                if(!passCorrect) {
                    return callback("Incorrect password", null);
                }

                // console.log(`Passport verification, foundUser:`, foundUser);
                return callback(null, foundUser);
            }
        )
    );

    // Serialze - save the cookie
    passport.serializeUser((user, callback) => {
        // console.log(`passport serializeUser user`, user);
        return callback(null, { id:user.id, username: user.username });
    });

    // Deserialize - pull information to verify password
    passport.deserializeUser((user, callback) => {
        // console.log(`passport deserializeUser user`, user);
        return callback(null, user);
    });

    router.get('/register', (req, res) => {
        res.render('auth/register', { username: res.locals.user?.username || ""  });
    });

    router.get('/login', (req, res) => {
        res.render('auth/login', { username: res.locals.user?.username || "" });
    });

    router.get('/logout', (req, res, next) => {
        req.logout(err => {
            if(err) {
                next(err);
                return;
            }
            res.redirect('/');
        });
    });

    router.post('/register', async (req, res) => {

        // Capture information from client
        const data = req.body;
        delete data.password2; // Delete the password confirmation field, so it does not end up on the database.
        delete data.submitBtn; // Just extra nonsense
        // console.log(`Registered route called with body data:`, data);
        
        // Creat this object to help the password serialization randomization process
        const salt = crypto.randomBytes(16).toString('hex');

        // Create a new promise so as to await the password serialization, which is given to use through a callback.
        const hashedPass = await new Promise((resolve, reject) => {
            // These parameters are just recommended by the library creators.
            crypto.pbkdf2(data.password, salt, passwordSaltIterations, passwordByteLength, passwordDigest, (err, hashPass) => {
                resolve(hashPass);
            });
        });

        // Register the user.
        const user = await mod_db.RegisterUser(data, hashedPass.toString('hex'), salt);
        // console.log(`Registered user and logging into passport: id <${user.insertedId.toString()}>, username <${data.username}>`);

        // Passport adds the req.login function, handling session storage - very convenient.
        await new Promise((resolve, reject) => {
            // console.log(`Post register with req:`, req);
            req.login({ id: user.insertedId.toString(), username: data.username }, (err) => {
                if(err) {
                    console.err(err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        // Once the user has been logged in, send them back to the main route, which will now have their login details to use.
        res.redirect('/');
    });

    router.post('/login', async (req, res, next) => {
        // console.log(`Post login with req.body:`, req.body);

        // This will use evrything that's been created near the top, passing the client data into the verification system, deserializing the cookie.
        // This returns a route callback, which we'll call immediately after with our route params. 
        const RouteCB = passport.authenticate('local', async(err, user) => {
            // console.log(`Login using passport.authenticate to get user:`, user);

            // If something went wrong, go back to the login form and exit function.
            if(err || !user) {
                res.redirect('/login');
                return;
            }

            await new Promise((resolve, reject) => {
                // console.log(`Post login with req:`, req);
                req.login({ id: user._id.toString(), username: user.username }, (err) => {
                    if(err) {
                        console.err(err);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });

            res.redirect('/');
        });

        RouteCB(req, res, next);        
    });

    return router;
}