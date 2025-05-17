# Guide de dépannage pour Nexie AI

Ce guide vous aidera à résoudre les problèmes courants avec l'intégration de Nexie AI dans votre application.

## Configuration de l'API OpenAI

### 1. Vérifier le fichier .env

Assurez-vous que votre fichier `.env` dans le dossier Backend contient une clé API OpenAI valide :

```
OPENAI_API_KEY=sk-votrecleopenaiici
```

**Important :** 
- La clé API doit commencer par `sk-`
- Ne pas inclure d'espaces ou de guillemets autour de la clé
- Le fichier doit être nommé exactement `.env` (pas `.env.local` ou autre)

### 2. Redémarrer le serveur

Après avoir modifié le fichier `.env`, redémarrez complètement votre serveur backend :

```
cd Backend
npm run dev
```

### 3. Tester la connexion API

Utilisez les boutons de test dans l'interface de Nexie :

- 🔄 : Teste la connexion à l'API OpenAI
- 🔍 : Affiche les variables d'environnement chargées

Vous pouvez également tester directement via les URL suivantes :

- `http://localhost:5001/api/ai/test-env` - Vérifie si la clé API est chargée
- `http://localhost:5001/api/ai/test-openai` - Teste la connexion à l'API OpenAI

### 4. Vérifier les journaux du serveur

Consultez la console du serveur backend pour voir les messages de débogage :

- "Dotenv config result: .env file loaded successfully" - Le fichier .env a été chargé
- "OpenAI API key found, length: XX" - La clé API a été trouvée
- "OpenAI API key is not configured in environment variables" - La clé API est manquante

## Problèmes courants

### Nexie affiche "Je suis actuellement en mode hors ligne"

Causes possibles :
1. La clé API OpenAI n'est pas configurée dans le fichier `.env`
2. Le fichier `.env` n'est pas chargé correctement
3. Le serveur n'a pas été redémarré après la modification du fichier `.env`

### Erreur "Désolé, je n'ai pas pu traiter votre demande"

Causes possibles :
1. La clé API OpenAI est invalide ou expirée
2. Problème de connexion à l'API OpenAI
3. Limite de requêtes atteinte sur votre compte OpenAI

### Obtenir une clé API OpenAI

1. Créez un compte sur [platform.openai.com](https://platform.openai.com/)
2. Accédez à la section "API Keys"
3. Cliquez sur "Create new secret key"
4. Copiez la clé et ajoutez-la à votre fichier `.env`

## Vérification du format de la clé API

Une clé API OpenAI valide :
- Commence toujours par `sk-`
- Contient des lettres et des chiffres
- Est généralement longue (environ 50 caractères)

Exemple : `sk-abcdefghijklmnopqrstuvwxyz123456789ABCDEFG`

## Support

Si vous continuez à rencontrer des problèmes après avoir suivi ce guide, contactez l'équipe de développement.
