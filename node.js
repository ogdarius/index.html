// server.js - Backend Node.js para integração KeyAuth
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do KeyAuth
const SELLER_KEY = 'da8f5a60723932f5c81f7bfa779ad72cd91310150cf80b2436526bb96d3f5f0c';
const KEYAUTH_API = 'https://keyauth.win/api/seller';

// Rota para gerar licenças
app.post('/generate-license', async (req, res) => {
    try {
        const { userId, productId, duration } = req.body;
        
        // Chamar a API do KeyAuth para gerar a licença
        const response = await axios.post(`${KEYAUTH_API}/license`, {
            sellerkey: SELLER_KEY,
            type: 'create',
            level: 1, // Nível de acesso
            expiry: duration, // Duração em dias
            mask: `${userId}-${productId}-${Date.now()}`, // Identificador único
            amount: 1 // Quantidade de licenças a gerar
        });

        if (response.data.success) {
            // Retornar a licença gerada
            res.json({
                success: true,
                license: response.data.license,
                message: 'Licença gerada com sucesso'
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.data.message
            });
        }
    } catch (error) {
        console.error('Erro ao gerar licença:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Webhook para processar pagamentos
app.post('/webhook/payment', async (req, res) => {
    try {
        const { gateway, paymentId, userId, productId, status, amount } = req.body;
        
        // Verificar se o pagamento foi aprovado
        if (status === 'approved') {
            // Determinar a duração com base no produto
            let duration = 7; // Duração padrão de 7 dias
            
            // Lógica para determinar a duração com base no produto
            if (productId === 'premium') {
                duration = 30;
            } else if (productId === 'vip') {
                duration = 365;
            }
            
            // Gerar a licença
            const licenseResponse = await axios.post('http://localhost:3000/generate-license', {
                userId,
                productId,
                duration
            });
            
            if (licenseResponse.data.success) {
                // Aqui você enviaria a licença por e-mail ou salvaria no banco de dados
                console.log(`Licença gerada para o usuário ${userId}: ${licenseResponse.data.license}`);
                
                // Retornar sucesso
                res.json({
                    success: true,
                    license: licenseResponse.data.license,
                    message: 'Pagamento processado e licença gerada com sucesso'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Erro ao gerar licença'
                });
            }
        } else {
            res.json({
                success: false,
                message: 'Pagamento não aprovado'
            });
        }
    } catch (error) {
        console.error('Erro no webhook de pagamento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
