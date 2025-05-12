# Admin Dashboard Fix

Ce document explique comment résoudre le problème d'affichage du tableau de bord administrateur.

## Problème

Le tableau de bord administrateur ne s'affiche pas correctement. Cela peut être dû à plusieurs raisons :

1. Le serveur backend n'est pas en cours d'exécution
2. Problème d'authentification
3. Problème avec les API endpoints
4. Problème de configuration

## Solution

### 1. Vérifier l'authentification

Assurez-vous d'être connecté en tant qu'administrateur. Utilisez les identifiants suivants :

- Email: `admin@welearn.com`
- Mot de passe: `Hama@Hama1*`

### 2. Utiliser le script d'aide à la connexion

Si vous avez des problèmes pour vous connecter, vous pouvez utiliser le script d'aide à la connexion :

1. Ouvrez votre navigateur et accédez à l'application
2. Ouvrez la console développeur (F12 ou Ctrl+Shift+I)
3. Copiez et collez le contenu du fichier `Frontend/src/loginHelper.js` dans la console
4. Appuyez sur Entrée pour exécuter le script

Ce script vous connectera automatiquement en tant qu'administrateur et vous redirigera vers le tableau de bord.

### 3. Vérifier l'état du serveur backend

Assurez-vous que le serveur backend est en cours d'exécution :

1. Ouvrez un terminal
2. Naviguez vers le dossier Backend : `cd Backend`
3. Démarrez le serveur : `node server.js`

Le serveur devrait démarrer sur le port 5001.

### 4. Modifications apportées au code

Les fichiers suivants ont été modifiés pour résoudre le problème :

- `Frontend/src/pages/Admin/AdminLayout.jsx` : Correction de la vérification d'authentification
- `Frontend/src/pages/Admin/AdminDashboard.jsx` : Ajout de données de secours en cas d'échec de l'API

### 5. Vérifier la configuration de l'API

Assurez-vous que le fichier `Frontend/src/config/api.js` pointe vers la bonne URL du serveur backend :

```javascript
export const API_BASE_URL = 'http://localhost:5001';
```

## Dépannage supplémentaire

Si vous rencontrez toujours des problèmes :

1. Vérifiez les erreurs dans la console du navigateur
2. Vérifiez les journaux du serveur backend
3. Assurez-vous que MongoDB est accessible
4. Essayez de vous déconnecter complètement et de vous reconnecter

## Contact

Si vous avez besoin d'aide supplémentaire, veuillez contacter l'équipe de développement.
