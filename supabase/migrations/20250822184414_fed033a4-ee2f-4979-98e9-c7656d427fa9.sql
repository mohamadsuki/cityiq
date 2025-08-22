-- Clean up incorrect budget authorization data
DELETE FROM budget_authorizations WHERE created_at >= NOW() - INTERVAL '2 hours';