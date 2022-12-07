import express from 'express';
import { IsAuthenticated } from '../helpers/auth.js'

export function CatsRouter(mod_db) {

    // We create and return this object that contains all the routes we set up right here, hence using "router.get" and not "app.get".
    // Let's us segreagate route code into different files based on type.
    const router = express.Router();

    router.get('/', async (req, res) => {
        // console.log(`Home page res.locals:`, res.locals);

        const randBreed = await mod_db.GetRandomBreed();
        // console.log(randBreed);
        const randFact = await mod_db.GetRandomFact();
        // console.log(randFact);
    
        res.render('home', {
            randBreed,
            randFact,
            username: res.locals.user?.username || ""
        });
    });

    router.get('/breeds', IsAuthenticated, async (req, res) => {
  
        const catBreeds = await mod_db.GetBreeds();
        // console.log(catBreeds);
      
        res.render('breeds', {
            docArr_Breeds: catBreeds,
            username: res.locals.user?.username || ""
        });
    });
    
    router.get('/breeds/:breedId', IsAuthenticated, async (req, res) => {
        const isValidId = await mod_db.IsObjectId(req.params.breedId);
        // console.log(`Reached cat breeds by id route <${req.params.breedId}>, is valid object id <${isValidId}>`);
    
        if(!isValidId) {
            res.end();
            return;
        }
    
        const catBreed = await mod_db.GetBreed(req.params.breedId);
        // console.log(catBreed);
      
        res.render('breed', {
            doc_Breed: catBreed,
            username: res.locals.user?.username || ""
        });
    });
    
    router.get('/facts', async (req, res) => {
    
        const catFacts = await mod_db.GetFacts();
        // console.log(catFacts);
    
        res.render('facts', {
            docArr_Facts: catFacts,
            username: res.locals.user?.username || ""
        });
    });
    
    router.get('/facts/:factId', async (req, res) => {
        const isValidId = await mod_db.IsObjectId(req.params.factId);
        // console.log(`Reached cat breeds by id route <${req.params.factId}>, is valid object id <${isValidId}>`);
    
        if(!isValidId) {
            res.end();
            return;
        }
    
        const catFact = await mod_db.GetFact(req.params.factId);
        // console.log(catFact);
      
        res.render('fact', {
            doc_Fact: catFact,
            username: res.locals.user?.username || ""
        });
    });

    return router;
}