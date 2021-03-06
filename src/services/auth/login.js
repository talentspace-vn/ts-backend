import User from '../../models/User';
import jsonResponse from '../../utils/jsonResponse';
import { generateToken } from '../../utils/jwtHelper';

export default (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const bodyParams = JSON.parse(event.body);
    const { email, password } = bodyParams;
    if (!email || !password) {
      return callback(null, jsonResponse.badRequest('Missing params'));
    }
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          return callback(null, jsonResponse.badRequest('User not found'));
        }
        return [user, user.comparePassword(password)];
      })
      .spread((user, passwordMatched) => {
        if (!passwordMatched) {
          return callback(null, jsonResponse.badRequest('User not found'));
        }
        if (!user.email_verified) {
          return callback(null, jsonResponse.badRequest('Account email not verified'));
        }
        if (!user.activated) {
          return callback(null, jsonResponse.badRequest('Account not activated'));
        }
        const tokenPayload = {
          data: user.toObject(),
        };
        callback(null, jsonResponse.success({
          token: generateToken(tokenPayload),
        }));
      })
      .catch(err => callback(null, jsonResponse.serverError(err.message)));
  } catch (err) {
    callback(null, jsonResponse.badRequest(err));
  }
};
