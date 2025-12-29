-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 29-12-2025 a las 21:50:02
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sisventareact`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `arqueos`
--

CREATE TABLE `arqueos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `fecha_apertura` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_inicial` decimal(10,2) DEFAULT NULL,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `ventas_efectivo` decimal(10,2) DEFAULT 0.00,
  `ventas_tarjeta` decimal(10,2) DEFAULT 0.00,
  `ventas_mercadopago` decimal(10,2) DEFAULT 0.00,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `arqueos`
--

INSERT INTO `arqueos` (`id`, `empresa_id`, `usuario_id`, `fecha_apertura`, `fecha_cierre`, `monto_inicial`, `monto_final`, `ventas_efectivo`, `ventas_tarjeta`, `ventas_mercadopago`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2025-12-29 09:00:00', '2025-12-29 14:38:00', 10000.00, 11000.00, 11000.00, 0.00, 0.00, 'Apertura Matutina', '2025-12-29 20:28:26', '2025-12-29 20:38:24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `empresa_id`, `created_at`, `updated_at`) VALUES
(1, 'Bebidas sin alcohol', 'Bebidas naturales, juegos, gaceosas, agua.', 1, '2025-03-03 18:23:29', '2025-03-03 18:23:29'),
(2, 'Bebidas alcohólicas', 'Vinos, cervesas, wiskys, espumantes', 1, '2025-03-03 18:24:49', '2025-03-03 18:24:49'),
(3, 'Pastas', 'Todo relacionado a las pastas (fideos secos, pastas caseras, etc)', 1, '2025-03-03 19:23:46', '2025-03-03 19:23:46'),
(4, 'Galletitas', 'Todo tipo de galletitas', 1, '2025-03-03 20:17:49', '2025-03-03 20:17:49'),
(5, 'Productos enlatados', 'todos los enlatados', 1, '2025-03-04 14:18:44', '2025-03-04 14:18:44'),
(6, 'Almacen', 'Productos en Polvo, Productos Instantaneos', 1, '2025-03-26 13:39:45', '2025-03-31 14:41:07'),
(7, 'Fiambrería', 'Productos de Fiambrería', 1, '2025-03-30 15:46:34', '2025-03-30 15:46:34'),
(8, 'Panaderia', 'Productos Panificados', 1, '2025-03-30 16:11:28', '2025-03-30 16:11:28'),
(9, 'Productos lácteos', 'Queso rallado', 1, '2025-04-08 14:48:20', '2025-04-08 14:48:20'),
(10, 'Perfumeria', 'Perfumes, dewsodorantes, porductos de limpieza personal', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras`
--

CREATE TABLE `compras` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `fecha` date NOT NULL,
  `comprobante` varchar(255) NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `deuda` decimal(10,2) NOT NULL DEFAULT 0.00,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `proveedor_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_compras`
--

CREATE TABLE `detalle_compras` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cantidad` int(11) NOT NULL,
  `compra_id` bigint(20) UNSIGNED NOT NULL,
  `producto_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresas`
--

CREATE TABLE `empresas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pais` varchar(255) NOT NULL,
  `nombre_empresa` varchar(255) NOT NULL,
  `tipo_empresa` varchar(255) NOT NULL,
  `cuit` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `cantidad_impuesto` int(11) NOT NULL,
  `nombre_impuesto` varchar(255) NOT NULL,
  `moneda` varchar(255) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `provincia` varchar(255) NOT NULL,
  `localidad` varchar(255) NOT NULL,
  `codigo_postal` varchar(255) NOT NULL,
  `logo` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `empresas`
--

INSERT INTO `empresas` (`id`, `pais`, `nombre_empresa`, `tipo_empresa`, `cuit`, `telefono`, `correo`, `cantidad_impuesto`, `nombre_impuesto`, `moneda`, `direccion`, `provincia`, `localidad`, `codigo_postal`, `logo`, `created_at`, `updated_at`) VALUES
(1, 'Argentina', 'Morrone Ventas', 'Comercial', '12345678', '1138669097', 'admin@admin.com', 21, 'Iva', '$', 'Juan Agustin Garcia 6 A', 'Buenos Aires', 'Villa Santa Rita', '1416', 'logo-1766939244318-216285233.png', '2025-03-04 16:37:54', '2025-12-25 23:50:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `model_has_roles`
--

CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimiento_cajas`
--

CREATE TABLE `movimiento_cajas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tipo` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `arqueo_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `movimiento_cajas`
--

INSERT INTO `movimiento_cajas` (`id`, `tipo`, `monto`, `descripcion`, `arqueo_id`, `created_at`, `updated_at`) VALUES
(1, 'Ingreso', 2000.00, 'Cobro cliente pedro', 1, '2025-12-29 20:29:22', '2025-12-29 20:29:22'),
(2, 'Egreso', 1000.00, 'Pago servicio agua', 1, '2025-12-29 20:30:01', '2025-12-29 20:30:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago_compras`
--

CREATE TABLE `pago_compras` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `compra_id` bigint(20) UNSIGNED NOT NULL,
  `proveedor_id` bigint(20) UNSIGNED NOT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(255) NOT NULL,
  `fecha_pago` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'ver_usuarios', '0000-00-00 00:00:00', NULL),
(2, 'ver_roles', NULL, NULL),
(3, 'ver_permisos', NULL, NULL),
(4, 'ver_empresa', NULL, NULL),
(5, 'ver_categorias', NULL, NULL),
(6, 'ver_unidades', NULL, NULL),
(7, 'ver_productos', NULL, NULL),
(8, 'ver_proveedores', NULL, NULL),
(9, 'ver_compras', NULL, NULL),
(10, 'ver_clientes', NULL, NULL),
(11, 'ver_ventas', NULL, NULL),
(12, 'ver_arqueos', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `codigo` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `nombre_corto` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen` text DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `stock_minimo` int(11) NOT NULL,
  `stock_maximo` int(11) NOT NULL,
  `precio_compra` decimal(8,2) NOT NULL,
  `precio_venta` decimal(8,2) NOT NULL DEFAULT 0.00,
  `aplicar_porcentaje` tinyint(1) NOT NULL DEFAULT 0,
  `valor_porcentaje` decimal(5,2) DEFAULT 0.00,
  `fecha_ingreso` date NOT NULL,
  `categoria_id` bigint(20) UNSIGNED NOT NULL,
  `unidad_id` bigint(20) UNSIGNED DEFAULT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `codigo`, `nombre`, `nombre_corto`, `descripcion`, `imagen`, `stock`, `stock_minimo`, `stock_maximo`, `precio_compra`, `precio_venta`, `aplicar_porcentaje`, `valor_porcentaje`, `fecha_ingreso`, `categoria_id`, `unidad_id`, `empresa_id`, `created_at`, `updated_at`) VALUES
(1, '7790070336217', 'Fideos Mostachol N°52 Matarazzo 500g', 'FIDEOS MOSTACHOL 52 MATA', NULL, NULL, 43, 20, 10000, 600.00, 1300.00, 1, 100.00, '2025-03-03', 3, 1, 1, '2025-03-03 19:26:32', '2025-04-17 13:14:15'),
(2, '7790040139657', 'Merengadas Bagley 88g', 'MERENGADAS.BAGLEY', NULL, NULL, 95, 20, 1000, 550.00, 1000.00, 1, 100.00, '2025-03-03', 4, 1, 1, '2025-03-03 20:20:59', '2025-12-24 23:59:49'),
(3, '7790040677005', 'Tortitas sabor chocolate Arcor 152g', 'ARCOR TORTITAS CHO', NULL, NULL, 42, 20, 1000, 600.00, 1100.00, 1, 100.00, '2025-03-03', 4, 1, 1, '2025-03-03 20:22:36', '2025-04-17 13:39:55'),
(4, '7790895000218', 'Coca Cola 2L Env. Retornable', 'COCA COLA ENV. RET', NULL, NULL, 25, 10, 10000, 1550.00, 2700.00, 1, 100.00, '2025-03-03', 1, 1, 1, '2025-03-03 21:45:31', '2025-12-25 00:00:18'),
(5, '7791270336998', 'Vino Luigi Bosca - Tinto - Malbec - 750ml', 'VINO LUIGI TITNO MALBEC', NULL, NULL, 10, 5, 100, 9600.00, 14250.00, 1, 50.00, '2025-03-03', 2, 1, 1, '2025-03-03 21:57:38', '2025-04-17 13:23:40'),
(6, '7798132920848', 'Tomate Perita Clasico - Canale 400g', 'LATA PERITA CANALE 400G', NULL, NULL, 43, 10, 500, 800.00, 1600.00, 1, 100.00, '2025-03-04', 5, 1, 1, '2025-03-04 14:23:23', '2025-04-17 13:45:18'),
(7, '7798177401296', 'Galletitas Saladas con Queso Talitas Urquiza', 'URQUIZA/CINDA.QUESO', 'Talitas con Queso', NULL, 39, 10, 10000, 550.00, 1100.00, 1, 100.00, '2025-03-03', 4, 1, 1, '2025-03-25 16:31:45', '2025-07-21 13:39:14'),
(8, '7798177401449', 'Galletitas Sabor Cheddar Talitas Urquiza', 'URQUIZA/CINDA.CHED', 'Talitas Cheddar', NULL, 55, 10, 10000, 550.00, 1100.00, 1, 100.00, '2025-03-05', 4, 1, 1, '2025-03-26 13:35:35', '2025-04-17 13:53:56'),
(9, '7613034449993', 'Cocolate en Polvo Nesquik 360g Nestle', 'NESQUIK NESTLE 360G', 'Chocolate en Polvo', NULL, 27, 10, 10000, 1800.00, 3000.00, 1, 100.00, '2025-03-05', 6, 1, 1, '2025-03-26 13:48:00', '2025-04-08 00:26:16'),
(10, '7790070336200', 'Fideos Penne Rigate N°48 Matarazzo 500g', 'FIDEOS PENNE RIGATE MATA', NULL, NULL, 33, 10, 10000, 600.00, 1000.00, 1, 100.00, '2025-03-06', 3, 1, 1, '2025-03-27 21:49:16', '2025-04-17 13:31:13'),
(11, '7790070320032', 'Fideos Municiones Matarazzo 500g', 'FIDEOS MUNICIONES MATA', NULL, NULL, 37, 10, 10000, 600.00, 1100.00, 1, 100.00, '2025-03-06', 4, 1, 1, '2025-03-27 23:47:12', '2025-04-17 13:50:24'),
(12, '7899674034000', 'Jamon Cocido Calchaqui', 'JAMON COCIDO CALCHAQUI', NULL, NULL, 2250, 1000, 100000, 5.80, 0.00, 1, 100.00, '2025-03-20', 7, 3, 1, '2025-03-30 16:07:32', '2025-04-15 00:37:31'),
(13, '7899674034001', 'Queso de Barra Calchaqui', 'QUESO BARRA CALCHAQUI', NULL, NULL, 2250, 1000, 100000, 5.80, 0.00, 1, 100.00, '2025-03-20', 7, 3, 1, '2025-03-30 16:10:34', '2025-04-15 00:37:31'),
(14, '7793890258752', 'Lactal - Pan de Mesa - 460g. Fargo', 'LACTAL/PAN MESA', 'Pan lactal en paquete naylon', NULL, 11, 10, 100, 1725.00, 0.00, 1, 100.00, '2025-03-20', 8, 1, 1, '2025-03-30 16:15:52', '2025-04-13 20:10:14'),
(15, '7790070562074', 'Chipá tipo caseros Lucchetti 400g', 'CHIPA LUCCHETTI 400G', NULL, NULL, 34, 10, 100, 1500.00, 0.00, 1, 100.00, '2025-03-20', 6, 1, 1, '2025-03-30 16:21:43', '2025-04-17 13:41:28'),
(16, '7798113301529', 'Soda Manaos 2L', 'SODA/MANAOS', NULL, NULL, 24, 10, 1000, 750.00, 0.00, 1, 100.00, '2025-03-31', 1, 1, 1, '2025-03-31 13:48:11', '2025-04-17 13:44:40'),
(17, '7795265005114', 'Mini Alfaj. R.  Maicena - Cabo Blanco 145gr.', 'CABO BLANCO MAICEN', NULL, NULL, 22, 10, 100, 750.00, 0.00, 1, 100.00, '2025-03-31', 4, 1, 1, '2025-03-31 14:49:58', '2025-07-21 13:39:30'),
(18, '7794000006379', 'Puré de Papas R. Completa - Knorr 125gr.', 'KNORR/PU.PAP.COMP', NULL, NULL, 11, 10, 100, 1350.00, 2700.00, 1, 100.00, '2025-03-31', 6, 1, 1, '2025-03-31 14:54:47', '2025-12-27 23:31:05'),
(19, '7790040139091', 'Merengadas Pack Bagley 264g', 'MERENGADAS PACK', NULL, NULL, 13, 10, 100, 1350.00, 0.00, 1, 100.00, '2025-04-08', 4, 1, 1, '2025-04-08 14:31:11', '2025-04-17 13:47:06'),
(20, '7790070507372', 'Jugo 100% Limon Minerva', 'MINERVA LIMON', NULL, NULL, 13, 10, 100, 675.00, 0.00, 1, 100.00, '2025-04-08', 1, 1, 1, '2025-04-08 14:38:58', '2025-04-17 13:47:58'),
(21, '7790742223005', 'Queso Rallado Reggianito La Serenisima 70g', 'QUESO RALLADO SERE', NULL, NULL, 49, 10, 100, 1300.00, 0.00, 1, 100.00, '2025-04-08', 9, 1, 1, '2025-04-08 14:51:02', '2025-04-17 13:47:39'),
(22, '7790742223203', 'Queso Rallado Reggianito La Serenisima 175g', 'SERE/QUESO.RALLADO', NULL, NULL, 16, 10, 100, 3350.00, 0.00, 1, 100.00, '2025-04-08', 9, 1, 1, '2025-04-08 14:53:07', '2025-04-09 23:18:24'),
(23, '7790742222909', 'Queso Rallado Reggianito La Serenisima 35g', 'SERE/QUESO.RALLA35', NULL, NULL, 48, 10, 100, 600.00, 0.00, 1, 100.00, '2025-04-10', 9, 1, 1, '2025-04-10 12:21:52', '2025-04-17 13:54:45'),
(24, '7790903001374', 'Lactal - Pan de Mesa - 550g. La Perla', 'LA PERLA/PAN TRADI', NULL, NULL, 44, 10, 100, 1650.00, 0.00, 1, 100.00, '2025-04-14', 8, 1, 1, '2025-04-15 00:28:39', '2025-04-17 13:55:01'),
(25, '7509552851618', 'Crema Para Peinar Elvive L´OREAL', 'CREMA-PEINAR-LOREAL', '', '/src/assets/productos/imagen-1766940421332-736015180.jpg', 20, 10, 0, 2000.00, 4000.00, 1, 100.00, '2025-12-28', 10, 1, 0, '2025-12-28 17:03:09', '2025-12-29 17:53:06'),
(26, '7791600018344', 'Desodorante Kevin Black 150 ml.', 'DESOKEVINBLAC150', '', '/src/assets/productos/imagen-1766941078241-318668786.jpg', 20, 10, 0, 1500.00, 3000.00, 1, 100.00, '2025-12-28', 3, 1, 0, '2025-12-28 17:03:09', '2025-12-29 17:53:23'),
(27, '7798149754221', 'Repelente de Insectos spray 200 ml', 'REPEL-INSECT-SP-200', '', NULL, 20, 10, 100, 1200.00, 2400.00, 1, 100.00, '2025-12-28', 10, 1, 1, '2025-12-28 17:08:53', '2025-12-28 17:08:53'),
(28, '7791293048031', 'Desodorante Dove Meb + care 150 ml', 'DESO-DOVE-CARE-150', '', NULL, 20, 10, 100, 1100.00, 2200.00, 1, 100.00, '2025-12-28', 10, 1, 1, '2025-12-28 18:50:33', '2025-12-29 17:53:48'),
(29, '7501054550563', 'Curitas Transpiel 40', 'CURITA-TRANS-40', '', NULL, 20, 10, 100, 500.00, 1000.00, 1, 100.00, '2025-12-28', 10, 1, 1, '2025-12-28 19:19:57', '2025-12-29 17:53:59'),
(30, '7790520014214', 'Lysoform Desinfectante 360 cm3', 'LYSO-DESIN-360', '', NULL, 20, 10, 100, 1500.00, 3000.00, 1, 100.00, '2025-12-28', 10, 1, 1, '2025-12-28 19:19:57', '2025-12-29 17:54:08'),
(31, '7791600065478', 'Caro Cuore Desodorante 123 ml', 'CARO-CUORE-123', '', NULL, 9, 10, 100, 2000.00, 4000.00, 1, 100.00, '2025-12-28', 10, 1, 1, '2025-12-28 19:19:57', '2025-12-29 17:46:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedors`
--

CREATE TABLE `proveedors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `empresa` varchar(255) NOT NULL,
  `marca` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contacto` varchar(255) NOT NULL,
  `celular` varchar(255) NOT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proveedors`
--

INSERT INTO `proveedors` (`id`, `empresa`, `marca`, `direccion`, `telefono`, `email`, `contacto`, `celular`, `empresa_id`, `created_at`, `updated_at`) VALUES
(1, 'Matarazzo Hnos.', 'Matarazzo', 'Rivadavia 1752 - CABA', '1122556688', 'matarazzo@gmail.com', 'Juan Ernesto Sabato', '1122558877', 1, '2025-03-03 22:30:45', '2025-03-03 22:30:45'),
(2, 'Arcor Hnos.', 'Arcor', 'Guaemes 2754 - CABA', '11447744', 'arcor@gmail.com', 'Pedro Scaloni', '11447788', 1, '2025-03-03 23:25:31', '2025-03-03 23:25:31'),
(3, 'Bagley S.A.', 'Bagley', 'Moreno 741 - CABA', '11336699', 'bagley@gmail.com', 'Alicia Ferraro', '11887755', 1, '2025-03-03 23:26:43', '2025-03-03 23:26:43'),
(4, 'Coca Cola - FEMESA', 'Coca Cola', 'Amancio Alcorta 3570 - Pompeya', '1146308999', 'cocacola@gmail.com', 'Juan Agustin Garcia', '1138669097', 1, '2025-03-04 00:41:29', '2025-03-04 00:41:29'),
(5, 'Capri Distribuidora SRL', 'Capri', 'Luis Braille 5655 - CABA', '1131758262', 'capri@gmail.com', 'Pepe Argento', '1155778955', 1, '2025-03-04 00:52:15', '2025-03-04 00:52:15'),
(6, 'Canale S.A.', 'Canale', 'Gaona 1258', '1122558877', 'canale@gmail.com', 'Hernan de la Serna', '1155447788', 1, '2025-03-04 17:25:14', '2025-03-04 17:25:14'),
(7, 'Urquiza Panificados S.R.L.', 'Urquiza', '1° de Agosto 5817, Villa Ballester', '1145893298', 'ventas@brurin.com.ar', 'Walter Giardino', '1122558745', 1, '2025-03-25 19:34:39', '2025-03-25 19:34:39'),
(8, 'Nestle Argentina S.A.', 'Nestle', 'Carlos Pellegrini 887 - CABA', '1156568687', 'nestle@gmail.com', 'Alicia Mendez', '1135784566', 1, '2025-03-26 16:53:17', '2025-03-26 16:53:17'),
(9, 'Molinos Rio de la Plata S.A.', 'Molinos', 'Ruta de la tradicción 3500 - 9 de abril - Bs. As.', '08005554321', 'contacto@molinos.com.ar', 'Patricia Altamirano', '1157856397', 1, '2025-03-30 19:25:37', '2025-03-30 19:25:37'),
(10, 'Compañia de Alimentos Fargo S.A.', 'Fargo', 'Av. Corrientes 330, Piso 6, Oficina 612, CABA', '08001220240', 'fargo@gmail.com', 'Ernesto Piparo', '1122486697', 1, '2025-03-30 19:28:46', '2025-03-30 19:28:46'),
(11, 'Fiambres Calchaqui S.R.L.', 'Calchaqui', 'El Arreo 220', '1144189384', 'calchaqui@gmail.com', 'Pepe Parada', '1145887895', 1, '2025-03-30 19:35:53', '2025-03-30 19:35:53'),
(12, 'Refres Now S.A.', 'Manaos', 'Brig. Juan Manuel de Rosas 25160 - Virrey del Pino - La Matanza', '1156998721', 'manaos@gmail.com', 'Julian Alvarez', '1154774556', 1, '2025-03-31 16:53:04', '2025-03-31 16:53:04'),
(13, 'Cabo Blanco Total S.A.', 'Cabo Blanco', 'Gran Piran 852, Aldo Bonzi, La Matanza', '1144789554', 'caboblanco@gmail.com', 'Enzo Fernandez', '1199877472', 1, '2025-03-31 17:59:19', '2025-03-31 17:59:19'),
(14, 'Unilever de Argentina S.A.', 'Knorr', 'Alf. H. Bouchard 4191 - Munro - Vicente Lopez', '080088886436', 'knorr@gmail.com', 'Calitos Tevez', '1132445752', 1, '2025-03-31 18:03:47', '2025-03-31 18:03:47'),
(15, 'Mastellone San Luis S.A.', 'La Serenisima', 'Ruta Prov. N° 2 B Km 1,5, Villa Mercedes. San Luis', '08005553243', 'laserenisima@gmail.com', 'Pedro Parada', '1155875632', 1, '2025-04-08 17:56:10', '2025-04-08 18:01:00'),
(16, 'La Perla S.A.', 'La Perla', 'Juan Austin Garcia 2752 6 A', '1138661609', 'nataliaoduber@gmail.com', 'Pedro Parada', '1155875632', 1, '2025-04-15 03:30:52', '2025-04-15 03:30:52'),
(17, 'Sideral SRL', 'Kevin', 'Juan de los palotes 1231 - Uruguay', '1136998877', 'sideral@gmail.com', 'Pedro Aznar', '1122547899', 1, '2025-12-28 22:00:40', '2025-12-28 22:08:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Administrador', NULL, NULL),
(2, 'Cajero/a', NULL, NULL),
(3, 'Compras', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_has_permissions`
--

CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `role_has_permissions`
--

INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 1),
(12, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tmp_compras`
--

CREATE TABLE `tmp_compras` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cantidad` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidads`
--

CREATE TABLE `unidads` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `unidads`
--

INSERT INTO `unidads` (`id`, `nombre`, `descripcion`, `empresa_id`, `created_at`, `updated_at`) VALUES
(1, 'Unidad', 'Unitario', 1, '2025-03-28 22:20:25', '2025-03-28 22:20:25'),
(2, 'Kilogramos', 'Kilogramos', 1, '2025-03-28 22:20:53', '2025-04-04 18:07:20'),
(3, 'Gramos', 'Gramos', 1, '2025-03-28 22:21:31', '2025-04-04 18:07:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `empresa_id` bigint(20) UNSIGNED NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `empresa_id`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@admin.com', NULL, '$2y$12$kXT4glz/JrN5Lbl0S7JWbuX2nKWNNOKVx8Ch7pTLEMDGvwmlEuwEa', 1, NULL, '2025-03-03 16:37:54', '2025-12-24 23:50:37'),
(2, 'Carla Almiron', 'carla@gmail.com', NULL, '$2y$12$CFBJpUEBt0G94/ozClDdX.ei6UgTKRrzYDTGj4kNxhy2vopuqzF8u', 1, NULL, '2025-04-10 14:20:22', '2025-04-10 14:20:22'),
(3, 'Federico Molinari', 'federico@gmail.com', NULL, '$2y$12$VyI9s2wS56tk5ZBlJ7sl0OtD4UV8ZMwc7WW6MDiuSe42LD8Bco/B6', 1, NULL, '2025-04-10 15:31:45', '2025-04-10 15:31:45'),
(4, 'Pedro Artazar', 'pedroartazar@gmail.com', NULL, '$2b$10$44oLCa7Z6IUhcZUBmgKrD.7tq/XjnAhp/Uuy3QbgGK/KzmM/d0tM2', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `arqueos`
--
ALTER TABLE `arqueos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `arqueos_usuario_id_foreign` (`usuario_id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categorias_nombre_unique` (`nombre`);

--
-- Indices de la tabla `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `compras_proveedor_id_foreign` (`proveedor_id`),
  ADD KEY `compras_usuario_id_foreign` (`usuario_id`);

--
-- Indices de la tabla `detalle_compras`
--
ALTER TABLE `detalle_compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `detalle_compras_compra_id_foreign` (`compra_id`),
  ADD KEY `detalle_compras_producto_id_foreign` (`producto_id`);

--
-- Indices de la tabla `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `empresas_cuit_unique` (`cuit`),
  ADD UNIQUE KEY `empresas_correo_unique` (`correo`);

--
-- Indices de la tabla `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD PRIMARY KEY (`role_id`,`model_type`,`model_id`),
  ADD KEY `model_has_roles_model_type_model_id_index` (`model_type`,`model_id`);

--
-- Indices de la tabla `movimiento_cajas`
--
ALTER TABLE `movimiento_cajas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `movimiento_cajas_arqueo_id_foreign` (`arqueo_id`);

--
-- Indices de la tabla `pago_compras`
--
ALTER TABLE `pago_compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pago_compras_compra_id_foreign` (`compra_id`),
  ADD KEY `pago_compras_proveedor_id_foreign` (`proveedor_id`),
  ADD KEY `pago_compras_empresa_id_foreign` (`empresa_id`),
  ADD KEY `pago_compras_usuario_id_foreign` (`usuario_id`);

--
-- Indices de la tabla `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `productos_codigo_unique` (`codigo`),
  ADD KEY `productos_categoria_id_foreign` (`categoria_id`),
  ADD KEY `unidad_id` (`unidad_id`);

--
-- Indices de la tabla `proveedors`
--
ALTER TABLE `proveedors`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`);

--
-- Indices de la tabla `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `role_has_permissions_role_id_foreign` (`role_id`);

--
-- Indices de la tabla `tmp_compras`
--
ALTER TABLE `tmp_compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tmp_compras_producto_id_foreign` (`producto_id`);

--
-- Indices de la tabla `unidads`
--
ALTER TABLE `unidads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unidads_nombre_unique` (`nombre`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_empresa_id_foreign` (`empresa_id`);

--
-- Indices de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `user_roles_role_id_foreign` (`role_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `arqueos`
--
ALTER TABLE `arqueos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `compras`
--
ALTER TABLE `compras`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_compras`
--
ALTER TABLE `detalle_compras`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `movimiento_cajas`
--
ALTER TABLE `movimiento_cajas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `pago_compras`
--
ALTER TABLE `pago_compras`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `proveedors`
--
ALTER TABLE `proveedors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tmp_compras`
--
ALTER TABLE `tmp_compras`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `unidads`
--
ALTER TABLE `unidads`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `arqueos`
--
ALTER TABLE `arqueos`
  ADD CONSTRAINT `arqueos_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `detalle_compras`
--
ALTER TABLE `detalle_compras`
  ADD CONSTRAINT `detalle_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `movimiento_cajas`
--
ALTER TABLE `movimiento_cajas`
  ADD CONSTRAINT `movimiento_cajas_arqueo_id_foreign` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pago_compras`
--
ALTER TABLE `pago_compras`
  ADD CONSTRAINT `pago_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pago_compras_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pago_compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pago_compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_categoria_id_foreign` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`unidad_id`) REFERENCES `unidads` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tmp_compras`
--
ALTER TABLE `tmp_compras`
  ADD CONSTRAINT `tmp_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
