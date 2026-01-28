# TODO: Implement Business Rules for Letterhead Management

## Backend Changes

- [x] Modify `updateKopSurat` in `backend/controllers/kopSuratController.js`: Remove `is_active` from destructuring, validation, and update query.
- [x] Add `activateKopSurat` function in `backend/controllers/kopSuratController.js`: Sets `is_active=1` for specified ID and `is_active=0` for all others.
- [x] Add `deactivateKopSurat` function in `backend/controllers/kopSuratController.js`: Sets `is_active=0` for specified ID.
- [x] Add PATCH routes `/:id/activate` and `/:id/deactivate` in `backend/routes/kopSuratRoutes.js`.

## Frontend Changes

- [x] Remove `is_active` checkbox and related logic from `frontend/src/pages/admin/EditKopSurat.jsx`.
- [ ] Add activate/deactivate buttons to actions column in `frontend/src/pages/admin/ListKopSurat.jsx` (conditional based on current status).
- [ ] Add `activate` and `deactivate` methods to `kopSuratAPI` in `frontend/src/services/api.js`.

## Testing

- [ ] Test backend endpoints to ensure only one active letterhead at a time.
- [ ] Test frontend UI for proper button states and list updates.
- [ ] Verify edit page no longer allows toggling active status.
