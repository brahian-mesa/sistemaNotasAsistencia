import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../style/Navbar.css";
import auth from "../utils/auth";
import db from "../utils/database";
import EditUsernameModal from "./EditUsernameModal";
import { GoHomeFill } from "react-icons/go"; // home icon
import { CalendarIcon } from '@heroicons/react/24/outline'; // Calendar icon
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'; // Notes icon
import { BookOpenIcon } from '@heroicons/react/24/outline'; // Book icon
import { PencilIcon } from '@heroicons/react/24/outline'; // Pencil icon
import { IoSettingsSharp } from "react-icons/io5"; // Settings icon
import { MdClose } from "react-icons/md"; // Close icon
import { LuCircleUserRound } from "react-icons/lu"; // User icon settings
import { MdColorLens } from "react-icons/md"; // Color icon settings
import { GrCircleInformation } from "react-icons/gr"; // Information icon settings
import { IoIosArrowForward } from "react-icons/io"; // row icon
import { ImExit } from "react-icons/im"; // Exit icon

export default function Sidebar() {
    const location = useLocation();
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [selectedSettingsTab, setSelectedSettingsTab] = useState("account");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [username, setUsername] = useState(auth.getCurrentUser()?.nombre || "Usuario");
    const [showEditModal, setShowEditModal] = useState(false);
    const [userEmail, setUserEmail] = useState(auth.getCurrentUser()?.usuario || "usuario@email.com");

    const settingsPanelRef = useRef(null);

    const [shouldRenderLogoutModal, setShouldRenderLogoutModal] = useState(false);
    const [animateLogoutModal, setAnimateLogoutModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setUsername(user.userName || "Usuario");
        }
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserEmail(user.userEmail || "usuario@email.com");
        }
    }, []);

    // Controla la animación al mostrar u ocultar
    useEffect(() => {
        if (showLogoutModal) {
            setShouldRenderLogoutModal(true);
            setTimeout(() => setAnimateLogoutModal(true), 10);
        } else {
            setAnimateLogoutModal(false);
            const timeoutId = setTimeout(() => {
                setShouldRenderLogoutModal(false);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [showLogoutModal]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEditModal) return;
            if (
                settingsPanelRef.current &&
                !settingsPanelRef.current.contains(event.target)
            ) {
                setShowSettingsPanel(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEditModal]);

    const getButtonClass = (buttonName) => {
        const baseClasses =
            "flex items-center justify-center w-full mx-auto px-6 py-4 font-[Inter] font-semibold text-lg hover:cursor-pointer transition-all duration-300 ease-in-out transform active:active-press button-style rounded-xl";

        const activeClasses =
            "bg-custom-pink text-white shadow-glow scale-105 border-2 border-pink-300";

        const hoverClasses =
            "hover:bg-purple-500 hover:scale-105 hover:shadow-purple hover:text-white hover:border-purple-400 bg-purple-600 text-white border-2 border-purple-500";

        const isActive = location.pathname === buttonName;

        return `${baseClasses} ${isActive ? activeClasses : hoverClasses}`;
    };

    const getLogoutModalClass = (isVisible) => {
        return `bg-[var(--color-quinto)] p-8 rounded-4xl h-57 min-w-[320px] text-center relative shadow-2xl transition-all duration-444 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top transform ${isVisible
            ? "opacity-100 scale-y-100 visible"
            : "opacity-0 scale-y-0 invisible"
            }`;
    };

    const getBackdropClass = (isVisible) => {
        return `fixed inset-0 z-[1000] flex items-center justify-center font-[Inter] transition-all duration-300 ease-in-out ${isVisible
            ? "bg-black/20 backdrop-blur-sm opacity-100"
            : "bg-black/0 backdrop-blur-0 opacity-0"
            }`;
    };

    const settingsButton = (buttonName) => {
        const settingsBaseClass =
            "flex items-center w-40 h-11 mt-1 rounded-xl font-[Inter] font-bold text- text-left text-[var(--color-secundario)] pl-3 transition-all duration-200 ease-in-out cursor-pointer active:active-press";
        const settingsActiveClass =
            "bg-[var(--color-secundario)] -translate-y-1 scale-105 text-white shadow-[0_8px_20px_0_rgba(139,92,246,0.5)]";
        const settingsHoverClass =
            "hover:-translate-y-1 hover:scale-105 hover:bg-[var(--color-quinto)] hover:text-white bg-transparent text-[var(--color-terciario)]";
        const isActive = selectedSettingsTab === buttonName;
        return `${settingsBaseClass} ${isActive ? settingsActiveClass : settingsHoverClass
            }`;
    };

    const renderSettingsContent = () => {
        switch (selectedSettingsTab) {
            case "account":
                return (
                    <div className="font-[Inter]">
                        <div className="flex justify-center mb-1">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <span className="flex justify-center items-center text-black mt-2">
                                    Sistema de Notas
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-col-3 gap-2 pt-2 text-[var(--color-secundario)]">
                            <div className="flex h-16 rounded-2xl bg-[var(--color-quinto)] items-center justify-between">
                                <p className="flex justify-items-start items-center pl-6">
                                    E-mail
                                </p>
                                <span className="pr-6">{userEmail}</span>
                            </div>

                            <div className="flex flex-col h-20 pt-5 pb-2 rounded-2xl bg-[var(--color-quinto)]">
                                <div className="flex items-center justify-between h-12">
                                    <p className="flex justify-items-start items-center pl-6">
                                        Usuario
                                    </p>
                                    <span className="pr-6">{username}</span>
                                </div>
                                <button
                                    className="self-end mr-6 mb-1 px-2 py-0 text-sm h-5 bg-gray-00 border border-[var(--color-secundario)] text-[var(--color-secundario)] rounded-xl hover:bg-[var(--color-secundario)] hover:text-[var(--color-quinto)] duration-300"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    Editar
                                </button>
                            </div>

                            <div className="flex h-14 rounded-2xl bg-[var(--color-quinto)] items-center justify-between">
                                <button
                                    className="h-full w-full text-red-600 font-bold cursor-pointer hover:bg-[var(--boton-House)] hover:rounded-2xl hover:contrast-150 transition-color duration-500 delay-50"
                                    onClick={() => setShowLogoutModal(true)}
                                >
                                    Cerrar Sesión
                                </button>
                                {shouldRenderLogoutModal && (
                                    <div
                                        className={getBackdropClass(animateLogoutModal)}
                                        onClick={() => setShowLogoutModal(false)}
                                    >
                                        <div
                                            className={getLogoutModalClass(animateLogoutModal)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h1 className="flex flex-col items-center text-2xl font-bold mb-4 text-black">
                                                <ImExit className="mb-2 text-2xl text-gray-500" />
                                                Cerrar Sesión
                                            </h1>
                                            <span className="text-gray-700/80">
                                                ¿Estás seguro de que quieres cerrar sesión?
                                            </span>
                                            <div className="flex justify-center gap-4 mt-6">
                                                <button
                                                    className="px-5 py-2 text-black font-medium rounded-4xl hover:bg-white/30 transition-colors cursor-pointer"
                                                    onClick={() => setShowLogoutModal(false)}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    className="px-5 py-2 bg-[var(--color-rojo1)] text-[var(--color-rojo2)] font-medium hover:bg-[#ff867a] rounded-4xl transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        auth.logout();
                                                        setShowLogoutModal(false);
                                                        navigate("/");
                                                    }}
                                                >
                                                    Confirmar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case "appearance":
                return (
                    <div className="flex flex-col gap-4 font-[Inter]">
                        <div className="p-3 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-3xl font-semibold text-black mb-2">
                                Apariencia
                            </h3>
                            <p className="text-lg text-gray-600">
                                Cambia la apariencia de la aplicación a un color de tu elección
                            </p>
                        </div>

                        {/* Selector de temas de colores - Compacto */}
                        <div className="grid grid-cols-5 gap-3 mt-4">
                            {[
                                { name: "default", color: "purple", title: "Púrpura" },
                                { name: "blue", color: "blue", title: "Azul" },
                                { name: "green", color: "green", title: "Verde" },
                                { name: "orange", color: "orange", title: "Naranja" },
                                { name: "red", color: "red", title: "Rojo" },
                                { name: "pink", color: "pink", title: "Rosa" },
                                { name: "teal", color: "teal", title: "Turquesa" },
                                { name: "indigo", color: "indigo", title: "Índigo" },
                                { name: "yellow", color: "yellow", title: "Amarillo" },
                                { name: "cyan", color: "cyan", title: "Cian" }
                            ].map((theme) => (
                                <button
                                    key={theme.name}
                                    className="flex flex-col items-center group"
                                    onClick={() => handleThemeChange(theme.name)}
                                    title={theme.title}
                                >
                                    <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-${theme.color}-500 hover:shadow-lg hover:scale-110 cursor-pointer transition-all duration-300 group-hover:shadow-${theme.color}-200`}>
                                        <div className={`w-1/2 h-full bg-${theme.color}-500 float-left`}></div>
                                        <div className={`w-1/2 h-1/2 bg-${theme.color}-300 float-left`}></div>
                                        <div className={`w-1/2 h-1/2 bg-${theme.color}-100 float-left`}></div>
                                    </div>
                                    <span className="text-xs text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {theme.title}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Botón para restablecer tema */}
                        <button
                            className="mt-6 py-3 px-4 bg-[var(--color-quinto)] text-black rounded-xl font-medium hover:bg-[var(--boton-House)] transition-colors duration-300 flex items-center justify-center relative overflow-hidden group"
                            onClick={handleResetTheme}
                        >
                            <span className="absolute w-0 h-0 bg-white opacity-30 rounded-full group-active:w-[300%] group-active:h-[300%] -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 transition-all duration-700 ease-in-out"></span>
                            <MdColorLens className="mr-2 text-xl" />
                            Restablecer tema
                        </button>
                    </div>
                );

            case "information":
                return (
                    <div className="flex flex-col gap-4 font-[Inter]">
                        <div className=" p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-3xl font-semibold text-black mb-2">
                                Información
                            </h3>
                            <p className="text-lg text-gray-600">
                                Información sobre el Sistema de Notas y sus desarrolladores.
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-500">
                                    Para más información, por favor contacta soporte.
                                </p>
                            </div>
                        </div>
                        <button className="h-18 rounded-2xl text-black bg-[var(--color-quinto)] flex items-center justify-between hover:text-white hover:bg-[var(--boton-House)] border border-transparent hover:border-black transition-color duration-500 delay-50 cursor-pointer">
                            <p className="flex pl-7 text-black">Desarrollador</p>
                            <span className="flex pr-7 justify-end ">
                                Información
                                <IoIosArrowForward className="mt-1.5" />
                            </span>
                        </button>
                        <a
                            className="h-18 rounded-2xl text-black bg-[var(--color-quinto)] flex items-center justify-between hover:text-white hover:bg-[var(--boton-House)] border border-transparent hover:border-black transition-color duration-500 delay-50 cursor-pointer"
                            href="#"
                        >
                            <p className="flex pl-7 text-black">Versión</p>
                            <span className="flex pr-7 justify-end ">Beta-1.0.0</span>
                        </a>
                    </div>
                );

            default:
                return (
                    <p className="text-gray-700">
                        Selecciona una opción para ver su contenido.
                    </p>
                );
        }
    };

    // Cambia el tema agregando la clase al <body>
    const applyThemeClass = (themeName) => {
        const themes = ["default", "blue", "green", "orange", "red", "pink", "teal", "indigo", "yellow", "cyan"];
        themes.forEach((t) => document.body.classList.remove(t));
        if (themeName && themes.includes(themeName) && themeName !== 'default') {
            document.body.classList.add(themeName);
        }
    };

    // Estado para el tema actual
    const [theme, setTheme] = useState("light");

    // Cargar tema desde Supabase al montar
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const config = await db.getConfiguracionUsuario();
                const temaGuardado = config?.tema || "light";
                setTheme(temaGuardado);
                applyThemeClass(temaGuardado);
                console.log('✅ Tema cargado desde Supabase:', temaGuardado);
            } catch (error) {
                console.error('❌ Error cargando tema:', error);
                setTheme("light");
                applyThemeClass("light");
            }
        };

        loadTheme();
    }, []);

    // Aplica el tema al montar y cuando cambia
    useEffect(() => {
        applyThemeClass(theme);
    }, [theme]);

    // Cambia el tema y lo guarda en Supabase
    const handleThemeChange = async (themeName) => {
        try {
            setTheme(themeName);
            await db.guardarConfiguracionUsuario({ tema: themeName });
            console.log(`🎨 Tema cambiado a: ${themeName} y guardado en Supabase`);
        } catch (error) {
            console.error('❌ Error guardando tema:', error);
        }
    };

    // Restablece el tema por defecto
    const handleResetTheme = async () => {
        try {
            setTheme("light");
            await db.guardarConfiguracionUsuario({ tema: "light" });
            applyThemeClass("light");
            console.log("🎨 Tema restablecido a light y guardado en Supabase");
        } catch (error) {
            console.error('❌ Error restableciendo tema:', error);
        }
    };

    return (
        <>
            {/* Sidebar para pantallas grandes */}
            <nav className="hidden lg:flex w-64 h-screen sidebar-rounded text-purple-800 flex-col shadow-2xl overflow-hidden">



                {/* Menu Items */}
                <div className="flex-1 px-4 py-8 flex flex-col justify-center space-y-4 overflow-hidden">
                    <Link to="/Home">
                        <button className={getButtonClass("/home")}>
                            <GoHomeFill className="w-6 h-6 mr-4" />
                            Home
                        </button>
                    </Link>

                    <Link to="/calendario">
                        <button className={getButtonClass("/calendario")}>
                            <CalendarIcon className="w-6 h-6 mr-4" />
                            Calendario
                        </button>
                    </Link>

                    <Link to="/materias">
                        <button className={getButtonClass("/materias")}>
                            <PencilIcon className="w-6 h-6 mr-4" />
                            Notas materias
                        </button>
                    </Link>

                    <Link to="/asistencia">
                        <button className={getButtonClass("/asistencia")}>
                            <ClipboardDocumentListIcon className="w-6 h-6 mr-4" />
                            Asistencia
                        </button>
                    </Link>

                    <Link to="/notas">
                        <button className={getButtonClass("/notas")}>
                            <BookOpenIcon className="w-6 h-6 mr-4" />
                            Notas Docente
                        </button>
                    </Link>

                    <Link to="/calendario-escolar">
                        <button className={getButtonClass("/calendario-escolar")}>
                            <BookOpenIcon className="w-6 h-6 mr-4" />
                            Calendario Escolar
                        </button>
                    </Link>
                </div>

                {/* Settings Button */}
                <div className="px-4 py-4 mt-auto">
                    <button
                        className="flex items-center justify-center w-full mx-auto px-6 py-4 font-[Inter] font-semibold text-lg text-white bg-purple-600 hover:bg-purple-500 hover:scale-105 hover:shadow-purple hover:border-purple-400 transition-all duration-300 ease-in-out button-style border-2 border-purple-500 rounded-xl"
                        onClick={() => {
                            if (window?.startViewTransition) {
                                window.startViewTransition(() => {
                                    setShowSettingsPanel((prev) => !prev);
                                });
                            } else {
                                setShowSettingsPanel((prev) => !prev);
                            }
                        }}
                    >
                        <IoSettingsSharp className="w-6 h-6 mr-4" />
                        Configuración
                    </button>
                </div>

                {/* Panel flotante de Configuraciones */}
                {showSettingsPanel && (
                    <div
                        ref={settingsPanelRef}
                        className="fixed inset-0 z-70 flex items-center justify-center bg-black/10 backdrop-blur-sm"
                    >
                        <div
                            id="settings-panel-view-transition"
                            className="settings-slide-in macos-elastic-open relative min-w-[800px] max-w-[90vw] h-[580px] p-8 bg-[var(--fondo)] rounded-2xl border-1 border-black/30  shadow-2xl "
                        >
                            {/* Botón de cerrar */}
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 hover:rounded-full hover:bg-[var(--color-quinto)] text-2xl font-bold p-2 cursor-pointer"
                                onClick={() => setShowSettingsPanel(false)}
                                aria-label="Cerrar"
                            >
                                <MdClose className="w-6 h-6" />
                            </button>

                            {/* Layout en dos columnas */}
                            <div className="flex gap-8 h-full mt-10 items-stretch">
                                {/* Navegación lateral */}
                                <nav className="flex flex-col gap-0 w-1/4 h-11/12 border-[var(--color-secundario)] border-r-1">
                                    <button
                                        className={settingsButton("account")}
                                        onClick={() => setSelectedSettingsTab("account")}
                                    >
                                        <LuCircleUserRound className="mr-2 h-6 w-6" />
                                        Cuenta
                                    </button>
                                    <button
                                        className={settingsButton("appearance")}
                                        onClick={() => setSelectedSettingsTab("appearance")}
                                    >
                                        <MdColorLens className="mr-2 h-6 w-6" />
                                        Apariencia
                                    </button>
                                    <button
                                        className={settingsButton("information")}
                                        onClick={() => setSelectedSettingsTab("information")}
                                    >
                                        <GrCircleInformation className="mr-2 h-6 w-6" />
                                        Información
                                    </button>
                                </nav>

                                {/* Contenido a la derecha */}
                                <div className="flex-1 bg-[var(--fondo)] rounded-xl h-11/12">
                                    {renderSettingsContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom nav para pantallas pequeñas */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bottom-nav-rounded text-purple-800 flex justify-center items-center py-6 shadow-2xl z-50 gap-6">
                {[
                    {
                        name: "/home",
                        icon: <GoHomeFill className="w-6 h-6" />,
                        label: "Home",
                    },
                    {
                        name: "/calendario",
                        icon: <CalendarIcon className="w-6 h-6" />,
                        label: "Calendario",
                    },
                    {
                        name: "/notas-docente",
                        icon: <PencilIcon className="w-6 h-6" />,
                        label: "Notas",
                    },
                    {
                        name: "/asistencia",
                        icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
                        label: "Asistencia",
                        isLink: true
                    }
                ].map((btn) => (
                    <Link
                        key={btn.name}
                        to={btn.name}
                        className="flex flex-col items-center justify-center gap-1 p-2"
                    >
                        <div
                            className={`flex items-center justify-center w-14 h-14 transition-all duration-300 ease-in-out border-2 ${location.pathname === btn.name
                                ? "bg-custom-pink text-white shadow-glow scale-110 border-pink-300 button-style"
                                : "bg-purple-600 text-white hover:bg-purple-500 hover:shadow-purple hover:scale-105 border-purple-500 button-style"
                                }`}
                        >
                            {btn.icon}
                        </div>
                        <span
                            className={`text-xs font-medium ${location.pathname === btn.name
                                ? "text-purple-800 font-bold"
                                : "text-purple-700"
                                }`}
                        >
                            {btn.label}
                        </span>
                    </Link>
                ))}

                {/* Botón de Configuración (separado para manejar el click diferente) */}
                <button
                    onClick={() => setShowSettingsPanel(true)}
                    className="flex flex-col items-center justify-center gap-1 p-2"
                >
                    <div
                        className={`flex items-center justify-center w-14 h-14 transition-all duration-300 ease-in-out border-2 ${showSettingsPanel
                            ? "bg-custom-pink text-white shadow-glow scale-110 border-pink-300 button-style"
                            : "bg-purple-600 text-white hover:bg-purple-500 hover:shadow-purple hover:scale-105 border-purple-500 button-style"
                            }`}
                    >
                        <IoSettingsSharp className="w-6 h-6" />
                    </div>
                    <span
                        className={`text-xs font-medium ${showSettingsPanel
                            ? "text-purple-800 font-bold"
                            : "text-purple-700"
                            }`}
                    >
                        Configuración
                    </span>
                </button>
            </nav>

            {/* Panel de Configuración */}
            {showSettingsPanel && (
                <div
                    ref={settingsPanelRef}
                    className="fixed inset-0 z-70 flex items-center justify-center bg-black/10 backdrop-blur-sm"
                >
                    <div
                        id="settings-panel-view-transition"
                        className="settings-slide-in macos-elastic-open relative min-w-[800px] max-w-[90vw] h-[580px] p-8 bg-[var(--fondo)] rounded-2xl border-1 border-black/30  shadow-2xl "
                    >
                        {/* Botón de cerrar */}
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 hover:rounded-full hover:bg-[var(--color-quinto)] text-2xl font-bold p-2 cursor-pointer"
                            onClick={() => setShowSettingsPanel(false)}
                            aria-label="Cerrar"
                        >
                            <MdClose className="w-6 h-6" />
                        </button>

                        {/* Layout en dos columnas */}
                        <div className="flex gap-8 h-full mt-10 items-stretch">
                            {/* Navegación lateral */}
                            <nav className="flex flex-col gap-0 w-1/4 h-11/12 border-[var(--color-secundario)] border-r-1">
                                <button
                                    className={settingsButton("account")}
                                    onClick={() => setSelectedSettingsTab("account")}
                                >
                                    <LuCircleUserRound className="mr-2 h-6 w-6" />
                                    Cuenta
                                </button>
                                <button
                                    className={settingsButton("appearance")}
                                    onClick={() => setSelectedSettingsTab("appearance")}
                                >
                                    <MdColorLens className="mr-2 h-6 w-6" />
                                    Apariencia
                                </button>
                                <button
                                    className={settingsButton("information")}
                                    onClick={() => setSelectedSettingsTab("information")}
                                >
                                    <GrCircleInformation className="mr-2 h-6 w-6" />
                                    Información
                                </button>
                            </nav>

                            {/* Contenido a la derecha */}
                            <div className="flex-1 bg-[var(--fondo)] rounded-xl h-11/12">
                                {renderSettingsContent()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para editar el nombre de usuario */}
            <EditUsernameModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                currentUsername={username}
                onSave={(newUsername) => setUsername(newUsername)}
            />
        </>
    );
}