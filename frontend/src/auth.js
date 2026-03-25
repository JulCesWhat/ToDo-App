import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js'

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
})

export const signIn = (email, password) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    const authDetails = new AuthenticationDetails({ Username: email, Password: password })

    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error('Password reset required')),
    })
  })

export const signUp = (email, password) =>
  new Promise((resolve, reject) => {
    userPool.signUp(email, password, [], null, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })

export const confirmSignUp = (email, code) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    user.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })

export const signOut = () => {
  const user = userPool.getCurrentUser()
  if (user) user.signOut()
}

export const getToken = () =>
  new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser()
    if (!user) return resolve(null)

    user.getSession((err, session) => {
      if (err || !session.isValid()) return resolve(null)
      resolve(session.getIdToken().getJwtToken())
    })
  })
