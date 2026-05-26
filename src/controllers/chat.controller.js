const { pool } = require('../config/database');
const logger = require('../utils/logger');

const renderChatPage = async (req, res) => {
    const inventoryId = parseInt(req.params.id, 10);
    const currentUserId = req.session.userId;
    // Capturamos el ID del otro usuario si viene en la URL (desde el inbox)
    const queryUserId = req.query.user ? parseInt(req.query.user, 10) : null;

    try {
        const itemQuery = 'SELECT * FROM inventory WHERE id = $1';
        const { rows: itemRows } = await pool.query(itemQuery, [inventoryId]);

        if (itemRows.length === 0) return res.status(404).send('Producto no encontrado');
        const item = itemRows[0];

        let partnerId;

        // LOGICA DE ROLES: ¿Soy el Vendedor o el Comprador?
        if (item.user_id === currentUserId) {
            // Soy el VENDEDOR de la placa
            if (!queryUserId) {
                // Si intento entrar desde el catálogo sin elegir un comprador, me saca
                return res.redirect('/inventory/my-publications');
            }
            partnerId = queryUserId; // Hablo con el comprador que hizo clic en el inbox
        } else {
            // Soy el COMPRADOR
            partnerId = item.user_id; // Hablo con el dueño de la placa
        }

        // Buscar el nombre de la persona con la que hablo
        const partnerQuery = 'SELECT id, first_name, last_name FROM users WHERE id = $1';
        const { rows: partnerRows } = await pool.query(partnerQuery, [partnerId]);
        const partner = partnerRows[0];

        // Buscar el historial entre NOSOTROS DOS
        const historyQuery = `
            SELECT * FROM messages 
            WHERE inventory_id = $1 
            AND (
                (sender_id = $2 AND receiver_id = $3) OR 
                (sender_id = $3 AND receiver_id = $2)
            )
            ORDER BY created_at ASC
        `;
        const { rows: history } = await pool.query(historyQuery, [
            inventoryId,
            currentUserId,
            partnerId
        ]);

        // Renderizar la vista enviando también la info del "partner"
        res.render('chat/chat', {
            title: `Chat: ${item.title}`,
            item,
            user: { id: currentUserId },
            partner, // Pasamos el destinatario real
            history
        });

    } catch (error) {
        logger.error('Error cargando la página de chat:', error);
        res.status(500).send('Error interno del servidor');
    }
};
const getInbox = async (req, res) => {
    const currentUserId = req.session.userId;

    try {
        // Obtenemos el último mensaje de cada conversación usando DISTINCT ON de PostgreSQL
        const query = `
            SELECT DISTINCT ON (m.inventory_id, other_user.id)
                m.inventory_id,
                i.title AS product_title,
                i.image_url,
                other_user.id AS other_user_id,
                other_user.first_name,
                other_user.last_name,
                m.content AS last_message,
                m.created_at
            FROM messages m
            JOIN inventory i ON m.inventory_id = i.id
            JOIN users other_user ON other_user.id = CASE
                WHEN m.sender_id = $1 THEN m.receiver_id
                ELSE m.sender_id
            END
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY m.inventory_id, other_user.id, m.created_at DESC;
        `;
        
        const { rows: conversations } = await pool.query(query, [currentUserId]);

        res.render('chat/inbox', { 
            title: 'Mis Mensajes', 
            conversations 
        });

    } catch (error) {
        logger.error('Error cargando la bandeja de entrada:', error);
        res.status(500).send('Error interno del servidor');
    }
};

module.exports = {
    renderChatPage,
    getInbox
};