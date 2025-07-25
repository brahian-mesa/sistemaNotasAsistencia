import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const EditUsernameModal = ({ show, onClose, currentUsername, onSave }) => {
    const [username, setUsername] = useState(currentUsername);

    const handleSave = () => {
        if (username.trim()) {
            // Actualizar en localStorage
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                user.userName = username;
                localStorage.setItem("user", JSON.stringify(user));
            } else {
                // Si no existe, crear un usuario básico
                localStorage.setItem("user", JSON.stringify({ userName: username, userEmail: "usuario@email.com" }));
            }

            onSave(username);
            onClose();
        }
    };

    const handleClose = () => {
        setUsername(currentUsername);
        onClose();
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            className="font-[Inter]"
        >
            <Modal.Header
                closeButton
                className="border-0"
                style={{ backgroundColor: 'var(--color-cuarto)' }}
            >
                <Modal.Title className="text-lg font-semibold text-gray-800">
                    Editar Nombre de Usuario
                </Modal.Title>
            </Modal.Header>

            <Modal.Body
                className="p-6"
                style={{ backgroundColor: 'var(--fondo)' }}
            >
                <Form>
                    <Form.Group>
                        <Form.Label className="text-sm font-medium text-gray-700 mb-2">
                            Nuevo nombre de usuario
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ingresa tu nuevo nombre"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer
                className="border-0 gap-2"
                style={{ backgroundColor: 'var(--fondo)' }}
            >
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg transition-colors text-white border-0"
                    style={{ backgroundColor: 'var(--color-secundario)' }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'var(--boton-House)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-secundario)'}
                >
                    Guardar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditUsernameModal; 