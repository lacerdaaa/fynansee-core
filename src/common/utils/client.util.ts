import { Request } from 'express';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

export const CLIENT_HEADER = 'x-client-id';

export type ClientRequest = Request & {
  clientId?: string;
  user?: JwtPayload;
};

export const resolveClientId = (req: ClientRequest) => {
  const headerValue = req.get?.(CLIENT_HEADER) ?? req.headers?.[CLIENT_HEADER];
  const headerClientId =
    typeof headerValue === 'string'
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0]
        : undefined;
  const rawParamClientId = req.params?.clientId;
  const paramClientId =
    typeof rawParamClientId === 'string'
      ? rawParamClientId
      : Array.isArray(rawParamClientId)
        ? rawParamClientId[0]
        : undefined;
  const userClientId = req.user?.clientId;
  const resolvedClientId = headerClientId ?? paramClientId ?? userClientId;

  return {
    headerClientId,
    paramClientId,
    userClientId,
    resolvedClientId,
  };
};
