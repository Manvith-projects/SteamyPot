import { buildPagination } from "../utils/pagination.js";

export const withPagination = (req, _res, next) => {
  const { page, limit, skip } = buildPagination(req.query);
  req.pagination = { page, limit, skip };
  next();
};
