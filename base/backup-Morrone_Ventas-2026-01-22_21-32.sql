-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: sisventareact
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ajustes`
--

DROP TABLE IF EXISTS `ajustes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ajustes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ajustes_producto_id_foreign` (`producto_id`),
  KEY `ajustes_empresa_id_foreign` (`empresa_id`),
  KEY `ajustes_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `ajustes_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ajustes_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ajustes_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ajustes`
--

LOCK TABLES `ajustes` WRITE;
/*!40000 ALTER TABLE `ajustes` DISABLE KEYS */;
INSERT INTO `ajustes` VALUES (1,4,1,'salida',1.00,'Envase roto','2026-01-08 17:05:00',1,'2026-01-11 20:05:45','2026-01-11 20:05:45'),(2,15,1,'entrada',1.00,'Sobrante en auditoria','2026-01-08 17:09:00',1,'2026-01-11 20:09:58','2026-01-11 20:09:58');
/*!40000 ALTER TABLE `ajustes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `arqueos`
--

DROP TABLE IF EXISTS `arqueos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `arqueos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `fecha_apertura` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'Abierto',
  `monto_inicial` decimal(10,2) DEFAULT NULL,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `monto_esperado` decimal(18,2) DEFAULT 0.00,
  `diferencia` decimal(18,2) DEFAULT 0.00,
  `ventas_efectivo` decimal(10,2) DEFAULT 0.00,
  `ventas_tarjeta` decimal(10,2) DEFAULT 0.00,
  `ventas_mercadopago` decimal(10,2) DEFAULT 0.00,
  `ventas_transferencia` decimal(18,2) DEFAULT 0.00,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `arqueos_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `arqueos_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arqueos`
--

LOCK TABLES `arqueos` WRITE;
/*!40000 ALTER TABLE `arqueos` DISABLE KEYS */;
INSERT INTO `arqueos` VALUES (1,1,1,1,'2026-01-01 09:00:00','2026-01-01 20:29:00','Cerrado',10000.00,21800.00,21800.00,0.00,11800.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-20 22:41:56','2026-01-20 23:30:18'),(2,1,1,1,'2026-01-02 09:00:00','2026-01-02 12:10:00','Cerrado',10000.00,12600.00,12600.00,0.00,25200.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-20 23:31:02','2026-01-21 15:11:21'),(3,1,1,1,'2026-01-03 12:11:00','2026-01-03 16:13:00','Cerrado',10000.00,29000.00,29000.00,0.00,19000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-21 15:11:53','2026-01-21 19:13:58'),(4,1,2,2,'2026-01-04 16:18:00',NULL,'Abierto',10000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-21 19:18:41','2026-01-21 19:18:41');
/*!40000 ALTER TABLE `arqueos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria_seguridad`
--

DROP TABLE IF EXISTS `auditoria_seguridad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditoria_seguridad` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `caja_id` int(11) NOT NULL,
  `tipo_evento` enum('ITEM_BORRADO','VENTA_CANCELADA','DESCUENTO_EXCESIVO','TICKET_CERO') DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `monto_afectado` decimal(12,2) DEFAULT 0.00,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_seguridad`
--

LOCK TABLES `auditoria_seguridad` WRITE;
/*!40000 ALTER TABLE `auditoria_seguridad` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria_seguridad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `margen_objetivo` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorias_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Bebidas sin alcohol','Bebidas naturales, juegos, gaceosas, agua.',1,'2025-03-03 18:23:29','2025-03-03 18:23:29',100.00),(2,'Bebidas alcohólicas','Vinos, cervesas, wiskys, espumantes',1,'2025-03-03 18:24:49','2025-03-03 18:24:49',100.00),(3,'Pastas','Todo relacionado a las pastas (fideos secos, pastas caseras, etc)',1,'2025-03-03 19:23:46','2025-03-03 19:23:46',100.00),(4,'Galletitas','Todo tipo de galletitas',1,'2025-03-03 20:17:49','2025-03-03 20:17:49',200.00),(5,'Productos enlatados','todos los enlatados',1,'2025-03-04 14:18:44','2025-03-04 14:18:44',100.00),(6,'Almacen','Productos en Polvo, Productos Instantaneos',1,'2025-03-26 13:39:45','2025-03-31 14:41:07',100.00),(7,'Fiambrería','Productos de Fiambrería',1,'2025-03-30 15:46:34','2025-03-30 15:46:34',100.00),(8,'Panaderia','Productos Panificados',1,'2025-03-30 16:11:28','2025-03-30 16:11:28',100.00),(9,'Productos lácteos','Queso rallado',1,'2025-04-08 14:48:20','2025-04-08 14:48:20',100.00),(10,'Perfumeria','Perfumes, desodorantes, porductos de limpieza personal',0,NULL,NULL,100.00),(14,'Cuidado Personal','repelentes tópicos (en crema, loción, spray para la piel)',0,NULL,NULL,100.00),(15,'Limpieza','Lavandina, Bolsas Residuos, Bolsas Consorcio',0,NULL,NULL,100.00),(16,'Golosinas','Caramelos, Gomitas, Alfajores',0,NULL,NULL,100.00);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_gastos`
--

DROP TABLE IF EXISTS `categorias_gastos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias_gastos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo` enum('fijo','variable') DEFAULT 'variable',
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `categorias_gastos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_gastos`
--

LOCK TABLES `categorias_gastos` WRITE;
/*!40000 ALTER TABLE `categorias_gastos` DISABLE KEYS */;
INSERT INTO `categorias_gastos` VALUES (1,'Alquiler','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:17:53'),(2,'Luz','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:23:23'),(3,'Internet','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:18:04'),(4,'Sueldos','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:23:40'),(5,'Limpieza','variable',1,'2026-01-05 19:06:09','2026-01-15 17:16:27'),(6,'Otros','variable',1,'2026-01-05 19:06:09','2026-01-15 17:16:52'),(7,'Agua','fijo',1,'2026-01-15 17:19:40','2026-01-15 17:19:40'),(8,'Gas','fijo',1,'2026-01-15 17:23:05','2026-01-15 17:23:05');
/*!40000 ALTER TABLE `categorias_gastos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_cliente` varchar(255) NOT NULL,
  `cuil_codigo` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `puntos` int(11) DEFAULT 0,
  `saldo_billetera` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Consumidor Final','00000000000','99999999','consumidorfinal@gmail.com',NULL,1,'2025-03-03 23:31:59','2025-03-03 23:31:59',0,0.00),(2,'Morrone Pablo Martín','22362590','1138669097','morronepablo@gmail.com','1971-08-14',1,'2025-03-04 17:47:48','2026-01-19 20:47:24',741,13000.00),(3,'Natalia Oduber','94654750','1138669097','nataliaoduber@gmail.com','2024-01-15',1,'2025-04-05 22:50:51','2026-01-15 20:05:49',346,0.00),(4,'Gustavo Vessani','20221349877','1138669097','gustavo@gmail.com',NULL,1,'2026-01-02 05:08:34','2026-01-19 21:24:42',366,0.00),(5,'Diego Martin Trinidad','25369785','1138669097','diegotrinidad@gmail.com','2025-01-15',1,'2026-01-06 11:58:54','2026-01-19 21:24:16',638,2000.00),(6,'Alba Alisa Rodriguez','96441182','1138669097','salbaearch@gmail.com',NULL,1,'2026-01-15 20:02:56','2026-01-19 21:19:49',1228,3000.00);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_producto`
--

DROP TABLE IF EXISTS `combo_producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `combo_producto` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `combo_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `cantidad` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `combo_producto_combo_id_foreign` (`combo_id`),
  KEY `combo_producto_producto_id_foreign` (`producto_id`),
  CONSTRAINT `combo_producto_combo_id_foreign` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `combo_producto_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_producto`
--

LOCK TABLES `combo_producto` WRITE;
/*!40000 ALTER TABLE `combo_producto` DISABLE KEYS */;
INSERT INTO `combo_producto` VALUES (1,1,1,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(2,1,6,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(3,1,4,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(4,2,3,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(5,2,2,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(6,2,10,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(7,2,9,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(10,3,12,250,'2025-03-31 14:32:59','2025-03-31 14:32:59'),(11,3,13,250,'2025-03-31 14:32:59','2025-03-31 14:32:59'),(15,4,1,1,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(16,4,2,2,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(17,4,9,1,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(18,5,34,1,'2026-01-17 20:59:55','2026-01-17 20:59:55'),(19,5,9,1,'2026-01-17 20:59:55','2026-01-17 20:59:55');
/*!40000 ALTER TABLE `combo_producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combos`
--

DROP TABLE IF EXISTS `combos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `combos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `codigo` varchar(255) NOT NULL,
  `precio_venta` decimal(8,2) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `combos_nombre_unique` (`nombre`),
  UNIQUE KEY `combos_codigo_unique` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combos`
--

LOCK TABLES `combos` WRITE;
/*!40000 ALTER TABLE `combos` DISABLE KEYS */;
INSERT INTO `combos` VALUES (1,'Combo Navidad','1001',10000.00,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(2,'Combo Invierno','1002',6000.00,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(3,'Combo Jamon y Queso 500g','1003',5800.00,1,'2025-03-30 16:46:55','2025-03-30 16:46:55'),(4,'Combo Reyes','1004',5000.00,1,'2026-01-03 03:07:46','2026-01-06 13:41:05'),(5,'Combo Leche - Chocolate','1005',5000.00,1,'2026-01-17 20:59:55','2026-01-17 20:59:55');
/*!40000 ALTER TABLE `combos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `comprobante` varchar(255) NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `deuda` decimal(10,2) NOT NULL DEFAULT 0.00,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `compras_proveedor_id_foreign` (`proveedor_id`),
  KEY `compras_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,'2026-01-01','FACTURA - 0001-0000001',70000.00,70000.00,1,1,1,4,'2026-01-01 23:00:27','2026-01-20 23:00:27'),(2,'2026-01-01','FACTURA - 0001-0000001',11600.00,11600.00,1,1,1,11,'2026-01-01 23:12:12','2026-01-20 23:12:12'),(3,'2026-01-01','FACTURA - 0001-0000001',33000.00,33000.00,1,1,1,22,'2026-01-01 23:17:39','2026-01-20 23:17:39'),(4,'2026-01-01','FACTURA - 0001-0000002',36000.00,36000.00,1,1,1,4,'2026-01-01 23:24:38','2026-01-20 23:24:38'),(5,'2026-01-02','FACTURA - 0001-0000002',32000.00,32000.00,1,1,1,22,'2026-01-02 23:45:20','2026-01-20 23:45:20');
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras_cta_cte`
--

DROP TABLE IF EXISTS `compras_cta_cte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras_cta_cte` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `devolucion_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `importe` decimal(8,2) NOT NULL,
  `metodo_pago` varchar(255) DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `compras_cta_cte_venta_id_unique` (`venta_id`),
  KEY `compras_cta_cte_cliente_id_foreign` (`cliente_id`),
  KEY `compras_cta_cte_empresa_id_foreign` (`empresa_id`),
  KEY `compras_cta_cte_devolucion_id_foreign` (`devolucion_id`),
  CONSTRAINT `compras_cta_cte_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_cta_cte_devolucion_id_foreign` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `compras_cta_cte_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_cta_cte_venta_id_foreign` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras_cta_cte`
--

LOCK TABLES `compras_cta_cte` WRITE;
/*!40000 ALTER TABLE `compras_cta_cte` DISABLE KEYS */;
INSERT INTO `compras_cta_cte` VALUES (1,5,NULL,3,11000.00,NULL,'deuda','2026-01-03',1,1,'2026-01-03 15:13:51','2026-01-21 15:13:51');
/*!40000 ALTER TABLE `compras_cta_cte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_comisiones_pagos`
--

DROP TABLE IF EXISTS `config_comisiones_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config_comisiones_pagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `metodo` enum('tarjeta','mercadopago','transferencia','billetera') NOT NULL,
  `comision_porcentaje` decimal(5,2) DEFAULT 0.00,
  `costo_fijo` decimal(10,2) DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `config_comisiones_pagos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_comisiones_pagos`
--

LOCK TABLES `config_comisiones_pagos` WRITE;
/*!40000 ALTER TABLE `config_comisiones_pagos` DISABLE KEYS */;
INSERT INTO `config_comisiones_pagos` VALUES (1,1,'tarjeta',3.50,0.00,'2026-01-16 17:20:01'),(2,1,'mercadopago',5.99,0.00,'2026-01-16 15:58:57'),(3,1,'transferencia',0.00,0.00,'2026-01-16 15:58:57'),(4,1,'billetera',0.00,0.00,'2026-01-16 15:58:57');
/*!40000 ALTER TABLE `config_comisiones_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_sessions`
--

DROP TABLE IF EXISTS `config_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unidad` enum('minutos','horas','dias') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_sessions`
--

LOCK TABLES `config_sessions` WRITE;
/*!40000 ALTER TABLE `config_sessions` DISABLE KEYS */;
INSERT INTO `config_sessions` VALUES (1,'horas',24,'2026-01-10 17:14:59');
/*!40000 ALTER TABLE `config_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compras`
--

DROP TABLE IF EXISTS `detalle_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `precio_compra` decimal(12,2) DEFAULT 0.00,
  `compra_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_compras_compra_id_foreign` (`compra_id`),
  KEY `detalle_compras_producto_id_foreign` (`producto_id`),
  CONSTRAINT `detalle_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
INSERT INTO `detalle_compras` VALUES (1,20,1750.00,1,4,'2026-01-01 23:00:27','2026-01-20 23:00:27'),(2,20,1750.00,1,45,'2026-01-01 23:00:27','2026-01-20 23:00:27'),(3,1000,5.80,2,12,'2026-01-01 23:12:12','2026-01-20 23:12:12'),(4,1000,5.80,2,13,'2026-01-01 23:12:12','2026-01-20 23:12:12'),(5,10,1650.00,3,4,'2026-01-01 23:17:39','2026-01-20 23:17:39'),(6,10,1650.00,3,45,'2026-01-01 23:17:39','2026-01-20 23:17:39'),(7,10,1800.00,4,4,'2026-01-01 23:24:38','2026-01-20 23:24:38'),(8,10,1800.00,4,45,'2026-01-01 23:24:38','2026-01-20 23:24:38'),(9,10,1600.00,5,4,'2026-01-02 23:45:20','2026-01-20 23:45:20'),(10,10,1600.00,5,45,'2026-01-02 23:45:20','2026-01-20 23:45:20');
/*!40000 ALTER TABLE `detalle_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_devoluciones`
--

DROP TABLE IF EXISTS `detalle_devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_devoluciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `devolucion_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_devoluciones_devolucion_id_foreign` (`devolucion_id`),
  KEY `detalle_devoluciones_producto_id_foreign` (`producto_id`),
  KEY `detalle_devoluciones_combo_id_foreign` (`combo_id`),
  CONSTRAINT `fk_det_devoluciones_cabecera` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_det_devoluciones_combos` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_det_devoluciones_productos` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_devoluciones`
--

LOCK TABLES `detalle_devoluciones` WRITE;
/*!40000 ALTER TABLE `detalle_devoluciones` DISABLE KEYS */;
INSERT INTO `detalle_devoluciones` VALUES (1,1,1,4,NULL,'2026-01-02 13:36:12','2026-01-21 13:36:12'),(2,1,2,45,NULL,'2026-01-02 13:39:06','2026-01-21 13:39:06'),(3,1,3,10,NULL,'2026-01-02 13:53:27','2026-01-21 13:53:27'),(4,1,4,41,NULL,'2026-01-21 20:00:39','2026-01-21 20:00:39');
/*!40000 ALTER TABLE `detalle_devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ordenes_compra`
--

DROP TABLE IF EXISTS `detalle_ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_ordenes_compra` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `orden_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `cantidad_pedida` int(11) NOT NULL,
  `cantidad_recibida` int(11) DEFAULT 0,
  `precio_estimado` decimal(18,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ordenes_compra`
--

LOCK TABLES `detalle_ordenes_compra` WRITE;
/*!40000 ALTER TABLE `detalle_ordenes_compra` DISABLE KEYS */;
INSERT INTO `detalle_ordenes_compra` VALUES (1,1,4,20,20,1750.00),(2,1,45,20,20,1750.00),(3,2,12,1000,1000,5.80),(4,2,13,1000,1000,5.80),(5,3,4,10,10,1750.00),(6,3,27,10,10,1200.00),(7,4,4,10,10,1650.00),(8,4,45,10,10,1650.00),(9,5,4,10,10,1800.00),(10,5,45,10,10,1800.00);
/*!40000 ALTER TABLE `detalle_ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ventas`
--

DROP TABLE IF EXISTS `detalle_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `venta_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `precio_compra` decimal(18,2) DEFAULT 0.00,
  `precio_venta` decimal(18,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_ventas_venta_id_foreign` (`venta_id`),
  KEY `detalle_ventas_producto_id_foreign` (`producto_id`),
  KEY `detalle_ventas_combo_id_foreign` (`combo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas`
--

LOCK TABLES `detalle_ventas` WRITE;
/*!40000 ALTER TABLE `detalle_ventas` DISABLE KEYS */;
INSERT INTO `detalle_ventas` VALUES (1,1,1,42,NULL,1000.00,2000.00,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(2,1,1,44,NULL,1400.00,2800.00,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(3,1,1,10,NULL,600.00,1200.00,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(4,1,2,NULL,3,2900.00,5800.00,'2026-01-20 22:54:47','2026-01-20 22:54:47'),(5,2,3,4,NULL,1800.00,3600.00,'2026-01-20 23:39:39','2026-01-20 23:39:39'),(6,2,3,45,NULL,1800.00,3600.00,'2026-01-20 23:39:39','2026-01-20 23:39:39'),(7,1,4,36,NULL,1500.00,3000.00,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(8,1,4,42,NULL,1000.00,2000.00,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(9,1,4,44,NULL,1400.00,2800.00,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(10,1,4,15,NULL,1500.00,3000.00,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(11,1,5,36,NULL,1500.00,3000.00,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(12,1,5,44,NULL,1400.00,2800.00,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(13,1,5,42,NULL,1000.00,2000.00,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(14,1,5,4,NULL,1600.00,3200.00,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(15,1,6,1,NULL,700.00,1400.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(16,1,6,10,NULL,600.00,1200.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(17,1,6,39,NULL,600.00,1200.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(18,1,6,8,NULL,1200.00,2400.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(19,1,6,7,NULL,1100.00,3300.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(20,1,6,38,NULL,1100.00,2200.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(21,1,6,17,NULL,1500.00,3000.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(22,1,6,18,NULL,1350.00,2700.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(23,1,6,40,NULL,800.00,1600.00,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(24,1,7,24,NULL,1650.00,3300.00,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(25,1,7,2,NULL,1100.00,2200.00,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(26,1,7,41,NULL,600.00,1200.00,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(27,1,7,18,NULL,1350.00,2700.00,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(28,1,7,23,NULL,600.00,1200.00,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(29,1,8,24,NULL,1650.00,3300.00,'2026-01-22 00:30:28','2026-01-22 00:30:28'),(30,1,8,2,NULL,1100.00,2200.00,'2026-01-22 00:30:28','2026-01-22 00:30:28'),(31,1,8,23,NULL,600.00,1200.00,'2026-01-22 00:30:28','2026-01-22 00:30:28');
/*!40000 ALTER TABLE `detalle_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devoluciones`
--

DROP TABLE IF EXISTS `devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devoluciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `motivo` text DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `devoluciones_empresa_id_foreign` (`empresa_id`),
  KEY `devoluciones_cliente_id_foreign` (`cliente_id`),
  KEY `devoluciones_venta_id_foreign` (`venta_id`),
  CONSTRAINT `fk_devoluciones_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_devoluciones_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devoluciones`
--

LOCK TABLES `devoluciones` WRITE;
/*!40000 ALTER TABLE `devoluciones` DISABLE KEYS */;
INSERT INTO `devoluciones` VALUES (1,NULL,'2026-01-02',3200.00,'Envase roto',1,1,1,1,'2026-01-02 13:36:12','2026-01-21 13:36:12'),(2,NULL,'2026-01-02',3200.00,'',1,1,1,1,'2026-01-02 13:39:06','2026-01-21 13:39:06'),(3,NULL,'2026-01-02',1200.00,'',1,1,1,1,'2026-01-02 13:53:27','2026-01-21 13:53:27'),(4,NULL,'2026-01-04',1200.00,'',1,2,2,1,'2026-01-21 20:00:39','2026-01-21 20:00:39');
/*!40000 ALTER TABLE `devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `empresas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NULL DEFAULT NULL,
  `meta_gastos_fijos` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empresas_cuit_unique` (`cuit`),
  UNIQUE KEY `empresas_correo_unique` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'Argentina','Morrone Ventas','Comercial','12345678','1138669097','admin@admin.com',21,'Iva','$','Juan Agustin Garcia 6 A','Buenos Aires','Villa Santa Rita','1416','logo-1766939244318-216285233.png','2025-03-05 07:37:54','2025-12-26 14:50:37',50000.00);
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gastos`
--

DROP TABLE IF EXISTS `gastos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gastos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `categoria_gasto_id` int(11) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','mercadopago','banco') DEFAULT 'efectivo',
  `usuario_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `arqueo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `categoria_gasto_id` (`categoria_gasto_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `arqueo_id` (`arqueo_id`),
  CONSTRAINT `gastos_ibfk_1` FOREIGN KEY (`categoria_gasto_id`) REFERENCES `categorias_gastos` (`id`),
  CONSTRAINT `gastos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`),
  CONSTRAINT `gastos_ibfk_3` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gastos_ibfk_4` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos`
--

LOCK TABLES `gastos` WRITE;
/*!40000 ALTER TABLE `gastos` DISABLE KEYS */;
INSERT INTO `gastos` VALUES (1,15000.00,'Pago Luz Diciembre 2025','2026-01-02 11:20:00',2,'efectivo',1,1,1,2,'2026-01-21 14:21:50','2026-01-21 14:21:50');
/*!40000 ALTER TABLE `gastos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_patrimonio`
--

DROP TABLE IF EXISTS `historial_patrimonio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_patrimonio` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `fecha` date DEFAULT curdate(),
  `valor_ars_total` decimal(18,2) NOT NULL,
  `cotizacion_usd` decimal(18,2) NOT NULL,
  `valor_usd_total` decimal(18,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empresa_id` (`empresa_id`,`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_patrimonio`
--

LOCK TABLES `historial_patrimonio` WRITE;
/*!40000 ALTER TABLE `historial_patrimonio` DISABLE KEYS */;
INSERT INTO `historial_patrimonio` VALUES (1,1,'2026-01-20',1948250.00,1472.90,1322.73),(7,1,'2026-01-21',1924000.00,1470.00,1308.84);
/*!40000 ALTER TABLE `historial_patrimonio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_precios`
--

DROP TABLE IF EXISTS `historial_precios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_precios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) unsigned NOT NULL,
  `precio_anterior` decimal(10,2) DEFAULT NULL,
  `precio_nuevo` decimal(10,2) DEFAULT NULL,
  `costo_anterior` decimal(18,2) DEFAULT 0.00,
  `costo_nuevo` decimal(18,2) DEFAULT 0.00,
  `fecha_cambio` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `historial_precios_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_precios`
--

LOCK TABLES `historial_precios` WRITE;
/*!40000 ALTER TABLE `historial_precios` DISABLE KEYS */;
INSERT INTO `historial_precios` VALUES (1,4,3500.00,3300.00,1750.00,1650.00,'2026-01-01 23:17:39'),(2,45,3500.00,3300.00,1750.00,1650.00,'2026-01-01 23:17:39'),(3,4,3300.00,3600.00,1650.00,1800.00,'2026-01-01 23:24:38'),(4,45,3300.00,3600.00,1650.00,1800.00,'2026-01-01 23:24:38'),(5,4,3600.00,3200.00,1800.00,1600.00,'2026-01-02 23:45:20'),(6,45,3600.00,3200.00,1800.00,1600.00,'2026-01-02 23:45:20');
/*!40000 ALTER TABLE `historial_precios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `accion` varchar(255) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `detalle` text DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `logs_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (1,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-20 22:40:12'),(2,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: YS20220950001068','::1',1,'2026-01-20 22:40:41'),(3,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-20 22:41:57'),(4,1,'CREAR','VENTAS','Venta registrada. Ticket: 1. Tiempo: 43s','::1',1,'2026-01-20 22:44:12'),(5,1,'CREAR','VENTAS','Venta registrada. Ticket: 2. Tiempo: 12s','::1',1,'2026-01-20 22:54:47'),(6,1,'CREAR','COMPRAS','Compra registrada $70000. Recalculo de precios ejecutado.','::1',1,'2026-01-20 23:00:27'),(7,1,'CREAR','COMPRAS','Compra registrada $11600. Recalculo de precios ejecutado.','::1',1,'2026-01-20 23:12:12'),(8,1,'CREAR','COMPRAS','Compra registrada $33000. Recalculo de precios ejecutado.','::1',1,'2026-01-20 23:17:39'),(9,1,'CREAR','COMPRAS','Compra registrada $36000. Recalculo de precios ejecutado.','::1',1,'2026-01-20 23:24:38'),(10,1,'CERRAR','ARQUEOS','Cierre ID 1. Venta declarada: 11800. Dif: 0','::1',1,'2026-01-20 23:30:18'),(11,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-20 23:31:02'),(12,1,'CREAR','VENTAS','Venta registrada. Ticket: 3. Tiempo: 39s','::1',1,'2026-01-20 23:39:39'),(13,1,'CREAR','COMPRAS','Compra registrada $32000. Recalculo de precios ejecutado.','::1',1,'2026-01-20 23:45:20'),(14,1,'BACKUP','SISTEMA','Se descargó una copia de seguridad de la base de datos.','::1',1,'2026-01-20 23:50:59'),(15,1,'CREAR','DEVOLUCIONES','Se registró la devolución N° 1 por un total de $3200. Motivo: Envase roto','::1',1,'2026-01-21 13:36:12'),(16,1,'CREAR','DEVOLUCIONES','Se registró la devolución N° 2 por un total de $3200. Motivo: No especificado','::1',1,'2026-01-21 13:39:06'),(17,1,'CREAR','DEVOLUCIONES','Se registró la devolución N° 3 por un total de $1200. Motivo: No especificado','::1',1,'2026-01-21 13:53:27'),(18,1,'CREAR','VENTAS','Venta registrada. Ticket: 4. Tiempo: 36s','::1',1,'2026-01-21 13:58:53'),(19,1,'CREAR','GASTOS','Se registró un gasto por $15000 (efectivo) en Caja 1. Descripción: Pago Luz Diciembre 2025','::1',1,'2026-01-21 14:21:50'),(20,1,'CERRAR','ARQUEOS','Cierre ID 2. Venta declarada: 25200. Dif: 0','::1',1,'2026-01-21 15:11:21'),(21,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-21 15:11:53'),(22,1,'CREAR','VENTAS','Venta registrada. Ticket: 5. Tiempo: 62s','::1',1,'2026-01-21 15:13:51'),(23,1,'CREAR','VENTAS','Venta registrada. Ticket: 6. Tiempo: 76s','::1',1,'2026-01-21 18:36:53'),(24,1,'CERRAR','ARQUEOS','Cierre ID 3. Venta declarada: 19000. Dif: 0','::1',1,'2026-01-21 19:13:58'),(25,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-21 19:14:11'),(26,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: YS20220950001068','::1',1,'2026-01-21 19:16:26'),(27,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-21 19:18:41'),(28,2,'CREAR','VENTAS','Venta registrada. Ticket: 7. Tiempo: 57s','::1',1,'2026-01-21 19:20:49'),(29,2,'CREAR','DEVOLUCIONES','Se registró devolución N° 4 por $1200. Cajero ID: 2','::1',1,'2026-01-21 20:00:39'),(30,2,'CREAR','VENTAS','Venta registrada. Ticket: 8. Tiempo: 79s','::1',1,'2026-01-22 00:30:28');
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_type`,`model_id`),
  KEY `model_has_roles_model_type_model_id_index` (`model_type`,`model_id`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_cajas`
--

DROP TABLE IF EXISTS `movimiento_cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimiento_cajas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `arqueo_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `pago_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `movimiento_cajas_arqueo_id_foreign` (`arqueo_id`),
  CONSTRAINT `movimiento_cajas_arqueo_id_foreign` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_cajas`
--

LOCK TABLES `movimiento_cajas` WRITE;
/*!40000 ALTER TABLE `movimiento_cajas` DISABLE KEYS */;
INSERT INTO `movimiento_cajas` VALUES (1,'Ingreso',6000.00,'Venta Ticket N° 1',1,1,NULL,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(2,'Ingreso',5800.00,'Venta Ticket N° 2',1,1,NULL,'2026-01-20 22:54:47','2026-01-20 22:54:47'),(3,'Ingreso',14400.00,'Venta Ticket N° 3',2,1,NULL,'2026-01-20 23:39:39','2026-01-20 23:39:39'),(4,'Egreso',3200.00,'Devolución N° 1',2,1,NULL,'2026-01-21 13:36:12','2026-01-21 13:36:12'),(5,'Egreso',3200.00,'Devolución N° 2',2,1,NULL,'2026-01-21 13:39:06','2026-01-21 13:39:06'),(6,'Egreso',1200.00,'Devolución N° 3',2,1,NULL,'2026-01-21 13:53:27','2026-01-21 13:53:27'),(7,'Ingreso',10800.00,'Venta Ticket N° 4',2,1,NULL,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(8,'Egreso',15000.00,'Gasto: Pago Luz Diciembre 2025',2,1,NULL,'2026-01-21 14:21:50','2026-01-21 14:21:50'),(9,'Ingreso',19000.00,'Venta Ticket N° 6',3,1,NULL,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(10,'Ingreso',10600.00,'Venta Ticket N° 7',4,2,NULL,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(11,'Egreso',1200.00,'Devolución N° 4',4,1,NULL,'2026-01-21 20:00:39','2026-01-21 20:00:39');
/*!40000 ALTER TABLE `movimiento_cajas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos`
--

DROP TABLE IF EXISTS `movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `origen` enum('compra','venta','devolucion','ajuste') NOT NULL,
  `origen_id` bigint(20) unsigned NOT NULL,
  `compra_id` bigint(20) unsigned DEFAULT NULL,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `ajuste_id` bigint(20) unsigned DEFAULT NULL,
  `devolucion_id` bigint(20) unsigned DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `movimientos_producto_id_foreign` (`producto_id`),
  KEY `movimientos_empresa_id_foreign` (`empresa_id`),
  KEY `movimientos_usuario_id_foreign` (`usuario_id`),
  KEY `movimientos_compra_id_foreign` (`compra_id`),
  KEY `movimientos_venta_id_foreign` (`venta_id`),
  KEY `movimientos_ajuste_id_foreign` (`ajuste_id`),
  KEY `fk_movimientos_devolucion` (`devolucion_id`),
  CONSTRAINT `fk_movimientos_compras` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movimientos_devolucion` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_4` FOREIGN KEY (`ajuste_id`) REFERENCES `ajustes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos`
--

LOCK TABLES `movimientos` WRITE;
/*!40000 ALTER TABLE `movimientos` DISABLE KEYS */;
INSERT INTO `movimientos` VALUES (1,42,1,'salida','venta',1,NULL,1,NULL,NULL,1.00,'2026-01-20 00:00:00',1,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(2,44,1,'salida','venta',1,NULL,1,NULL,NULL,1.00,'2026-01-20 00:00:00',1,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(3,10,1,'salida','venta',1,NULL,1,NULL,NULL,1.00,'2026-01-20 00:00:00',1,'2026-01-20 22:44:12','2026-01-20 22:44:12'),(4,12,1,'salida','venta',2,NULL,2,NULL,NULL,250.00,'2026-01-20 00:00:00',1,'2026-01-20 22:54:47','2026-01-20 22:54:47'),(5,13,1,'salida','venta',2,NULL,2,NULL,NULL,250.00,'2026-01-20 00:00:00',1,'2026-01-20 22:54:47','2026-01-20 22:54:47'),(6,4,1,'entrada','compra',1,NULL,NULL,NULL,NULL,20.00,'2026-01-01 00:00:00',1,'2026-01-20 23:00:27','2026-01-20 23:00:27'),(7,45,1,'entrada','compra',1,NULL,NULL,NULL,NULL,20.00,'2026-01-01 00:00:00',1,'2026-01-20 23:00:27','2026-01-20 23:00:27'),(8,12,1,'entrada','compra',2,NULL,NULL,NULL,NULL,1000.00,'2026-01-01 00:00:00',1,'2026-01-20 23:12:12','2026-01-20 23:12:12'),(9,13,1,'entrada','compra',2,NULL,NULL,NULL,NULL,1000.00,'2026-01-01 00:00:00',1,'2026-01-20 23:12:12','2026-01-20 23:12:12'),(10,4,1,'entrada','compra',3,NULL,NULL,NULL,NULL,10.00,'2026-01-01 00:00:00',1,'2026-01-20 23:17:39','2026-01-20 23:17:39'),(11,45,1,'entrada','compra',3,NULL,NULL,NULL,NULL,10.00,'2026-01-01 00:00:00',1,'2026-01-20 23:17:39','2026-01-20 23:17:39'),(12,4,1,'entrada','compra',4,NULL,NULL,NULL,NULL,10.00,'2026-01-01 00:00:00',1,'2026-01-20 23:24:38','2026-01-20 23:24:38'),(13,45,1,'entrada','compra',4,NULL,NULL,NULL,NULL,10.00,'2026-01-01 00:00:00',1,'2026-01-20 23:24:38','2026-01-20 23:24:38'),(14,4,1,'salida','venta',3,NULL,3,NULL,NULL,2.00,'2026-01-20 00:00:00',1,'2026-01-20 23:39:39','2026-01-20 23:39:39'),(15,45,1,'salida','venta',3,NULL,3,NULL,NULL,2.00,'2026-01-20 00:00:00',1,'2026-01-20 23:39:39','2026-01-20 23:39:39'),(16,4,1,'entrada','compra',5,NULL,NULL,NULL,NULL,10.00,'2026-01-02 00:00:00',1,'2026-01-20 23:45:20','2026-01-20 23:45:20'),(17,45,1,'entrada','compra',5,NULL,NULL,NULL,NULL,10.00,'2026-01-02 00:00:00',1,'2026-01-20 23:45:20','2026-01-20 23:45:20'),(18,4,1,'entrada','devolucion',1,NULL,NULL,NULL,1,1.00,'2026-01-02 00:00:00',1,'2026-01-21 13:36:12','2026-01-21 13:36:12'),(19,45,1,'entrada','devolucion',2,NULL,NULL,NULL,2,1.00,'2026-01-02 00:00:00',1,'2026-01-21 13:39:06','2026-01-21 13:39:06'),(20,10,1,'entrada','devolucion',3,NULL,NULL,NULL,3,1.00,'2026-01-02 00:00:00',1,'2026-01-21 13:53:27','2026-01-21 13:53:27'),(21,36,1,'salida','venta',4,NULL,4,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(22,42,1,'salida','venta',4,NULL,4,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(23,44,1,'salida','venta',4,NULL,4,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(24,15,1,'salida','venta',4,NULL,4,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 13:58:53','2026-01-21 13:58:53'),(25,36,1,'salida','venta',5,NULL,5,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(26,44,1,'salida','venta',5,NULL,5,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(27,42,1,'salida','venta',5,NULL,5,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(28,4,1,'salida','venta',5,NULL,5,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 15:13:51','2026-01-21 15:13:51'),(29,1,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(30,10,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(31,39,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(32,8,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(33,7,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(34,38,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(35,17,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(36,18,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(37,40,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-21 00:00:00',1,'2026-01-21 18:36:53','2026-01-21 18:36:53'),(38,24,1,'salida','venta',7,NULL,7,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(39,2,1,'salida','venta',7,NULL,7,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(40,41,1,'salida','venta',7,NULL,7,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(41,18,1,'salida','venta',7,NULL,7,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(42,23,1,'salida','venta',7,NULL,7,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-21 19:20:49','2026-01-21 19:20:49'),(43,41,1,'entrada','devolucion',4,NULL,NULL,NULL,4,1.00,'2026-01-04 00:00:00',2,'2026-01-21 20:00:39','2026-01-21 20:00:39'),(44,24,1,'salida','venta',8,NULL,8,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-22 00:30:28','2026-01-22 00:30:28'),(45,2,1,'salida','venta',8,NULL,8,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-22 00:30:28','2026-01-22 00:30:28'),(46,23,1,'salida','venta',8,NULL,8,NULL,NULL,1.00,'2026-01-21 00:00:00',2,'2026-01-22 00:30:28','2026-01-22 00:30:28');
/*!40000 ALTER TABLE `movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_billetera`
--

DROP TABLE IF EXISTS `movimientos_billetera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_billetera` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cliente_id` bigint(20) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `tipo` enum('carga','consumo') NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `caja_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_billetera`
--

LOCK TABLES `movimientos_billetera` WRITE;
/*!40000 ALTER TABLE `movimientos_billetera` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_billetera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_compra`
--

DROP TABLE IF EXISTS `ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ordenes_compra` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `estado` enum('Pendiente','Recibida','Cancelada') DEFAULT 'Pendiente',
  `total_estimado` decimal(18,2) DEFAULT 0.00,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra`
--

LOCK TABLES `ordenes_compra` WRITE;
/*!40000 ALTER TABLE `ordenes_compra` DISABLE KEYS */;
INSERT INTO `ordenes_compra` VALUES (1,'2026-01-01',4,1,1,'Recibida',70000.00,'','2026-01-01 22:58:28','2026-01-20 23:35:52'),(2,'2026-01-01',11,1,1,'Recibida',11600.00,'','2026-01-01 23:10:26','2026-01-20 23:35:56'),(3,'2026-01-01',22,1,1,'Recibida',29500.00,'','2026-01-01 23:16:09','2026-01-20 23:35:59'),(4,'2026-01-01',4,1,1,'Recibida',33000.00,'','2026-01-01 23:23:03','2026-01-20 23:36:03'),(5,'2026-01-02',22,1,1,'Recibida',36000.00,'','2026-01-20 23:43:51','2026-01-20 23:43:57');
/*!40000 ALTER TABLE `ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pago_compras`
--

DROP TABLE IF EXISTS `pago_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pago_compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `compra_id` bigint(20) unsigned NOT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(255) NOT NULL,
  `fecha_pago` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pago_compras_compra_id_foreign` (`compra_id`),
  KEY `pago_compras_proveedor_id_foreign` (`proveedor_id`),
  KEY `pago_compras_empresa_id_foreign` (`empresa_id`),
  KEY `pago_compras_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `pago_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pago_compras_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pago_compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pago_compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago_compras`
--

LOCK TABLES `pago_compras` WRITE;
/*!40000 ALTER TABLE `pago_compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `pago_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) DEFAULT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `compra_cta_cte_id` bigint(20) unsigned DEFAULT NULL,
  `monto` decimal(8,2) NOT NULL,
  `metodo_pago` varchar(255) NOT NULL,
  `fecha_pago` date NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `arqueo_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pagos_venta_id_foreign` (`venta_id`),
  KEY `pagos_cliente_id_foreign` (`cliente_id`),
  KEY `pagos_compra_cta_cte_id_foreign` (`compra_cta_cte_id`),
  KEY `pagos_empresa_id_foreign` (`empresa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'ver_usuarios','0000-00-00 00:00:00',NULL),(2,'ver_roles',NULL,NULL),(3,'ver_permisos',NULL,NULL),(4,'ver_empresa',NULL,NULL),(5,'ver_categorias',NULL,NULL),(6,'ver_unidades',NULL,NULL),(7,'ver_productos',NULL,NULL),(8,'ver_proveedores',NULL,NULL),(9,'ver_compras',NULL,NULL),(10,'ver_clientes',NULL,NULL),(11,'ver_ventas',NULL,NULL),(12,'ver_arqueos',NULL,NULL),(13,'ver_combos',NULL,NULL),(14,'ver_devoluciones',NULL,NULL),(15,'ver_configuracion',NULL,NULL),(16,'ver_ajustes',NULL,NULL),(17,'ver_movimientos',NULL,NULL),(18,'ver_gastos',NULL,NULL),(19,'ver_logs',NULL,NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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
  `categoria_id` bigint(20) unsigned NOT NULL,
  `unidad_id` bigint(20) unsigned DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `productos_codigo_unique` (`codigo`),
  KEY `productos_categoria_id_foreign` (`categoria_id`),
  KEY `unidad_id` (`unidad_id`),
  CONSTRAINT `productos_categoria_id_foreign` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`unidad_id`) REFERENCES `unidads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'7790070336217','Fideos Mostachol N°52 Matarazzo 500g','FIDEOS MOSTACHOL 52 MATA','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071765/productos_sistema_ventas/avinjbfq88ca5bcbwwxd.jpg',39,20,10000,700.00,1400.00,1,100.00,'2025-03-03',3,1,1,'2025-03-03 19:26:32','2026-01-21 18:36:53'),(2,'7790040139657','Merengadas Bagley 88g','MERENGADAS.BAGLEY','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072277/productos_sistema_ventas/wistkxrz3a5kisagproi.jpg',86,20,1000,1100.00,2200.00,1,100.00,'2025-03-03',4,1,1,'2025-03-03 20:20:59','2026-01-22 00:30:28'),(3,'7790040677005','Tortitas sabor chocolate Arcor 152g','ARCOR TORTITAS CHO','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072846/productos_sistema_ventas/qc2awhzz9x2pqslicaie.jpg',33,20,1000,1500.00,3000.00,1,100.00,'2025-03-03',4,1,1,'2025-03-03 20:22:36','2026-01-19 22:10:20'),(4,'7790895000218','Coca Cola 2L Env. Retornable','COCA COLA ENV. RET','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071199/productos_sistema_ventas/phdk4g0ordkbwa7lwazr.png',87,10,10000,1600.00,3200.00,1,100.00,'2025-03-03',1,1,1,'2025-03-03 21:45:31','2026-01-21 15:13:51'),(5,'7791270336998','Vino Luigi Bosca - Tinto - Malbec - 750ml','VINO LUIGI TITNO MALBEC','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072906/productos_sistema_ventas/i3adqcg3hzx1wm1laukf.jpg',6,5,100,9600.00,14400.00,1,50.00,'2025-03-03',2,1,1,'2025-03-03 21:57:38','2026-01-19 22:10:20'),(6,'7798132920848','Tomate Perita Clasico - Canale 400g','LATA PERITA CANALE 400G','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072802/productos_sistema_ventas/ivspqw7aloazy5b5ex3g.jpg',32,10,500,800.00,1600.00,1,100.00,'2025-03-04',5,1,1,'2025-03-04 14:23:23','2026-01-18 21:11:59'),(7,'7798177401296','Galletitas Saladas con Queso Talitas Urquiza','URQUIZA/CINDA.QUESO','Talitas con Queso','https://res.cloudinary.com/draucg1h5/image/upload/v1768071963/productos_sistema_ventas/jmb54mywdnllwwf4f31l.jpg',33,10,10000,1100.00,3300.00,1,200.00,'2025-03-03',4,1,1,'2025-03-25 16:31:45','2026-01-21 18:36:53'),(8,'7798177401449','Galletitas Sabor Cheddar Talitas Urquiza','URQUIZA/CINDA.CHED','Talitas Cheddar','https://res.cloudinary.com/draucg1h5/image/upload/v1768071914/productos_sistema_ventas/jzgwjcifxiuvuntbb9pn.jpg',45,10,10000,1200.00,2400.00,1,100.00,'2025-03-05',4,1,1,'2025-03-26 13:35:35','2026-01-21 18:36:53'),(9,'7613034449993','Chocolate en Polvo Nesquik 360g Nestle','NESQUIK NESTLE 360G','Chocolate en Polvo','https://res.cloudinary.com/draucg1h5/image/upload/v1768071122/productos_sistema_ventas/pb6w2nqptexmalxqwhez.jpg',79,10,10000,1800.00,3600.00,1,100.00,'2025-03-05',6,1,1,'2025-03-26 13:48:00','2026-01-19 22:12:53'),(10,'7790070336200','Fideos Penne Rigate N°48 Matarazzo 500g','FIDEOS PENNE RIGATE MATA','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071852/productos_sistema_ventas/xx6vaiu5fv3asnnzhtop.jpg',14,10,10000,600.00,1200.00,1,100.00,'2025-03-06',3,1,1,'2025-03-27 21:49:16','2026-01-21 18:36:53'),(11,'7790070320032','Fideos Municiones Matarazzo 500g','FIDEOS MUNICIONES MATA','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071808/productos_sistema_ventas/llqh1kjkxdd4ukjkn6iu.jpg',25,10,10000,950.00,1900.00,1,100.00,'2025-03-06',3,1,1,'2025-03-27 23:47:12','2026-01-19 19:41:41'),(12,'7899674034000','Jamon Cocido Calchaqui','JAMON COCIDO CALCHAQUI','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072019/productos_sistema_ventas/oedhq2ivherqnbzx01qu.jpg',1000,1000,100000,5.80,11.60,1,100.00,'2025-03-20',7,3,1,'2025-03-30 16:07:32','2026-01-20 23:12:12'),(13,'7899674034001','Queso de Barra Calchaqui','QUESO BARRA CALCHAQUI','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072491/productos_sistema_ventas/yuiylmlz1ayxicvv6jl2.jpg',1000,1000,100000,5.80,11.60,1,100.00,'2025-03-20',7,3,1,'2025-03-30 16:10:34','2026-01-20 23:12:12'),(14,'7793890258752','Lactal - Pan de Mesa - 460g. Fargo','LACTAL/PAN MESA','Pan lactal en paquete naylon','https://res.cloudinary.com/draucg1h5/image/upload/v1768072133/productos_sistema_ventas/ft2wmmpzihktyiebsd4g.jpg',20,10,100,1750.00,3500.00,1,100.00,'2025-03-20',8,1,1,'2025-03-30 16:15:52','2026-01-18 18:22:16'),(15,'7790070562074','Chipá tipo caseros Lucchetti 400g','CHIPA LUCCHETTI 400G','','https://res.cloudinary.com/draucg1h5/image/upload/v1768069377/productos_sistema_ventas/hgm9bg7xdnehwprxfucm.jpg',22,10,100,1500.00,3000.00,1,100.00,'2025-03-20',6,1,1,'2025-03-30 16:21:43','2026-01-21 13:58:53'),(16,'7798113301529','Soda Manaos 2L','SODA/MANAOS','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072748/productos_sistema_ventas/xsebvbddkynzvipxuydi.jpg',23,10,1000,750.00,1500.00,1,100.00,'2025-03-31',1,1,1,'2025-03-31 13:48:11','2026-01-19 21:39:37'),(17,'7795265005114','Mini Alfaj. R.  Maicena - Cabo Blanco 145gr.','CABO BLANCO MAICEN','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072370/productos_sistema_ventas/rcqzrwmq07jjprplw9p8.jpg',24,10,100,1500.00,3000.00,1,100.00,'2025-03-31',4,1,1,'2025-03-31 14:49:58','2026-01-21 18:36:53'),(18,'7794000006379','Puré de Papas R. Completa - Knorr 125gr.','KNORR/PU.PAP.COMP','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072424/productos_sistema_ventas/xvpkelwxliq5xzlmxl54.jpg',20,10,100,1350.00,2700.00,1,100.00,'2025-03-31',6,1,1,'2025-03-31 14:54:47','2026-01-21 19:20:49'),(19,'7790040139091','Merengadas Pack Bagley 264g','MERENGADAS PACK','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072321/productos_sistema_ventas/mmujtzvwh4wputwnzmbm.jpg',25,10,100,2600.00,5200.00,1,100.00,'2025-04-08',4,1,1,'2025-04-08 14:31:11','2026-01-16 23:21:22'),(20,'7790070507372','Jugo 100% Limon Minerva','MINERVA LIMON','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072068/productos_sistema_ventas/dtogotxyv9qxbzdvabji.jpg',28,10,100,2300.00,4600.00,1,100.00,'2025-04-08',1,1,1,'2025-04-08 14:38:58','2026-01-17 22:21:05'),(21,'7790742223005','Queso Rallado Reggianito La Serenisima 70g','QUESO RALLADO SERE','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072648/productos_sistema_ventas/glw8xypsqaucp0wit1nl.jpg',47,10,100,1300.00,2600.00,1,100.00,'2025-04-08',9,1,1,'2025-04-08 14:51:02','2026-01-11 20:22:08'),(22,'7790742223203','Queso Rallado Reggianito La Serenisima 175g','SERE/QUESO.RALLADO','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072554/productos_sistema_ventas/mttbdszkcqovolhx7kqd.jpg',12,10,100,3350.00,6700.00,1,100.00,'2025-04-08',9,1,1,'2025-04-08 14:53:07','2026-01-16 18:25:44'),(23,'7790742222909','Queso Rallado Reggianito La Serenisima 35g','SERE/QUESO.RALLA35','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072600/productos_sistema_ventas/hxlul3ugwr7xjtho3ns5.jpg',43,10,100,600.00,1200.00,1,100.00,'2025-04-10',9,1,1,'2025-04-10 12:21:52','2026-01-22 00:30:28'),(24,'7790903001374','Lactal - Pan de Mesa - 550g. La Perla','LA PERLA/PAN TRADI','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072181/productos_sistema_ventas/nvjt5rawpsckcb5m1a8f.jpg',30,10,100,1650.00,3300.00,1,100.00,'2025-04-14',8,1,1,'2025-04-15 00:28:39','2026-01-22 00:30:28'),(27,'7798149754221','Repelente de Insectos spray 200 ml','REPEL-INSECT-SP-200','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072703/productos_sistema_ventas/qmgzmzm9xhpfifahgueh.jpg',26,10,100,1200.00,2400.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 17:08:53','2026-01-19 19:46:47'),(28,'7791293048031','Desodorante Dove Meb + care 150 ml','DESO-DOVE-CARE-150','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071689/productos_sistema_ventas/vjkculu5nhvvo8hmoqdj.jpg',30,10,100,1100.00,2200.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 18:50:33','2026-01-19 22:28:09'),(29,'7501054550563','Curitas Transpiel 40','CURITA-TRANS-40','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071619/productos_sistema_ventas/e7f7yjvg1k7zactj9teg.jpg',12,10,100,500.00,1000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-19 22:12:53'),(30,'7790520014214','Lysoform Desinfectante 360 cm3','LYSO-DESIN-360','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072224/productos_sistema_ventas/mvaip4ykbk4c6utnqaum.jpg',12,10,100,1500.00,3000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-19 18:51:27'),(31,'7791600065478','Caro Cuore Desodorante 123 ml','CARO-CUORE-123','','https://res.cloudinary.com/draucg1h5/image/upload/v1768069211/productos_sistema_ventas/ontlzcxg7icglndh5bz1.jpg',11,10,100,2000.00,4000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-15 14:50:39'),(32,'77980755','Crema Repelente de Insectos OFF Family 60g','OFF-CREAMA-60','Crema Repelente de Insectos','https://res.cloudinary.com/draucg1h5/image/upload/v1768071261/productos_sistema_ventas/fsfezgp8shie3hgm2npu.jpg',19,10,100,1500.00,3000.00,1,100.00,'2026-01-06',14,1,1,'2026-01-06 10:41:33','2026-01-19 18:28:26'),(33,'7790520025746','Mata Hormigas Raid Max 360cm3','RAID-MAT-HORM','Mata Hormigas Raid Max 360cm3','https://res.cloudinary.com/draucg1h5/image/upload/v1768073375/productos_sistema_ventas/n7wgwmigyxbw1cppsgj7.jpg',31,10,100,2300.00,4600.00,1,100.00,'2026-01-10',10,1,1,'2026-01-10 19:28:18','2026-01-19 22:14:16'),(34,'7790742363008','Leche Larga Vida Clasica La Serenisima','LECHE-LARGA-VC-LASERE','Leche Larga Vida Clasica La Serenisima 1L','https://res.cloudinary.com/draucg1h5/image/upload/v1768668656/productos_sistema_ventas/wug5hro27bmx6foxlfa4.jpg',31,10,100,1050.00,2100.00,1,100.00,'2026-01-17',9,1,1,'2026-01-17 16:50:56','2026-01-19 21:37:38'),(35,'7790742363107','Lecha Larga Vida Liviana La Serenisima','LECHE-LARGA-VL-LASERE','Lecha Larga Vida Liviana La Serenisima 1L','https://res.cloudinary.com/draucg1h5/image/upload/v1768668909/productos_sistema_ventas/tiohqukru2nbsxs8leyu.jpg',46,10,100,1050.00,2100.00,1,100.00,'2026-01-17',9,1,1,'2026-01-17 16:55:10','2026-01-19 22:14:16'),(36,'7790009530563','Bolsa de consorcio Cultura en Limpieza 90x120','BOL-CONS-90x120','Bolsa de consorcio Cultura en Limpieza 90x120','https://res.cloudinary.com/draucg1h5/image/upload/v1768691682/productos_sistema_ventas/ssd20aot6xl1hgi25uc5.jpg',39,10,100,1500.00,3000.00,1,100.00,'2026-01-17',15,1,1,'2026-01-17 23:14:43','2026-01-21 15:13:51'),(37,'7790109430480','Bolsas de Consorcio Cultura en Limpieza 80x110','BOL-CONS-80x110','Bolsas de Consorcio Cultura en Limpieza 80x110','https://res.cloudinary.com/draucg1h5/image/upload/v1768691958/productos_sistema_ventas/d3ajumldctq3ozcoxqga.jpg',50,10,100,1150.00,2300.00,1,100.00,'2026-01-17',15,1,1,'2026-01-17 23:19:18','2026-01-18 03:15:46'),(38,'7793253003715','Lavandina Ayudin Lavanda 1L','LAVANDINA-AYUDIN-LAV','Lavandina Ayudin Lavanda 1 litro','https://res.cloudinary.com/draucg1h5/image/upload/v1768692145/productos_sistema_ventas/frghxs0xwagiatdjpedk.jpg',20,10,100,1100.00,2200.00,1,100.00,'2026-01-17',15,1,1,'2026-01-17 23:22:25','2026-01-21 18:36:53'),(39,'7790580602000','Gomitas Mogul Frutales Arcor','GOMITAS-MOGUL','Gomitas Mogul Frutales Arcor','https://res.cloudinary.com/draucg1h5/image/upload/v1768692411/productos_sistema_ventas/saee46rqgsherpibrbic.jpg',22,10,100,600.00,1200.00,1,100.00,'2026-01-17',16,1,1,'2026-01-17 23:26:51','2026-01-21 18:36:53'),(40,'7790580421007','Rocklets Arcor 20g','ROCKLETS20','Rocklets Arcor 20 Gramos','https://res.cloudinary.com/draucg1h5/image/upload/v1768692643/productos_sistema_ventas/jeebefznkwowhe3qj2iv.jpg',24,10,100,800.00,1600.00,1,100.00,'2026-01-17',16,1,1,'2026-01-17 23:30:43','2026-01-21 18:36:53'),(41,'7798054220156','Pepas Membrillo Tereppín Emery 200g','PEPASTERE200','Pepas Membrillo Tereppín Emery 200g','https://res.cloudinary.com/draucg1h5/image/upload/v1768692931/productos_sistema_ventas/f1loihwqmbv1kittok1k.jpg',25,10,100,600.00,1200.00,1,100.00,'2026-01-17',4,1,1,'2026-01-17 23:35:32','2026-01-21 20:00:39'),(42,'7798094222318','Budin Chocolate Fantasía Nevares 180g','BUDIN-CHOCO-NEVARES','Budin Chocolate Fantasía Nevares 180g','https://res.cloudinary.com/draucg1h5/image/upload/v1768693166/productos_sistema_ventas/jrkxaek0fewrsmhpc4ga.jpg',48,10,100,1000.00,2000.00,1,100.00,'2026-01-17',6,1,1,'2026-01-17 23:39:26','2026-01-21 15:13:51'),(43,'7798094222325','Budin Limon Fantasía Nevares 180g','BUDIN-LIMON-NEVARES','Budin Limon Fantasía Nevares 180g','https://res.cloudinary.com/draucg1h5/image/upload/v1768693380/productos_sistema_ventas/rbnlzostebcdw4pqswes.jpg',60,10,100,1000.00,2000.00,1,100.00,'2026-01-17',6,1,1,'2026-01-17 23:43:00','2026-01-18 00:31:27'),(44,'8445291082199','Cafe Dolca Original Nescafe 100g','CAFE-DOLCA-100','Cafe Dolca Original Nescafe 100g','https://res.cloudinary.com/draucg1h5/image/upload/v1768693589/productos_sistema_ventas/ml0ulcelrv3gvvryijdw.jpg',35,10,100,1400.00,2800.00,1,100.00,'2026-01-17',6,1,1,'2026-01-17 23:46:29','2026-01-21 15:13:51'),(45,'7790895000225','Sprite 2L Env. Retornable','SPRITE2LRET','Sprite 2 Litros Envase Retornable','https://res.cloudinary.com/draucg1h5/image/upload/v1768861249/productos_sistema_ventas/xdvuxtvprq6kdkobdnxr.jpg',99,10,100,1600.00,3200.00,1,100.00,'2026-01-19',1,1,1,'2026-01-19 22:20:50','2026-01-21 13:39:06');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promociones`
--

DROP TABLE IF EXISTS `promociones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promociones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `nombre_promo` varchar(100) DEFAULT NULL,
  `tipo` enum('3x2','2da_al_70','2da_al_50','4x3') NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promociones`
--

LOCK TABLES `promociones` WRITE;
/*!40000 ALTER TABLE `promociones` DISABLE KEYS */;
INSERT INTO `promociones` VALUES (1,1,9,'Oferta Miercoles','3x2',1,'2026-01-13 01:34:21');
/*!40000 ALTER TABLE `promociones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedors`
--

DROP TABLE IF EXISTS `proveedors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proveedors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa` varchar(255) NOT NULL,
  `marca` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contacto` varchar(255) NOT NULL,
  `celular` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedors`
--

LOCK TABLES `proveedors` WRITE;
/*!40000 ALTER TABLE `proveedors` DISABLE KEYS */;
INSERT INTO `proveedors` VALUES (1,'Matarazzo Hnos.','Matarazzo','Rivadavia 1752 - CABA','1122556688','matarazzo@gmail.com','Juan Ernesto Sabato','1122558877',1,'2025-03-03 22:30:45','2025-03-03 22:30:45'),(2,'Arcor Hnos.','Arcor','Guaemes 2754 - CABA','11447744','arcor@gmail.com','Pedro Scaloni','11447788',1,'2025-03-03 23:25:31','2025-03-03 23:25:31'),(3,'Bagley S.A.','Bagley','Moreno 741 - CABA','11336699','bagley@gmail.com','Alicia Ferraro','11887755',1,'2025-03-03 23:26:43','2025-03-03 23:26:43'),(4,'Coca Cola - FEMESA','Coca Cola','Amancio Alcorta 3570 - Pompeya','1146308999','cocacola@gmail.com','Juan Agustin Garcia','1138669097',1,'2025-03-04 00:41:29','2025-03-04 00:41:29'),(5,'Capri Distribuidora SRL','Capri','Luis Braille 5655 - CABA','1131758262','capri@gmail.com','Pepe Argento','1155778955',1,'2025-03-04 00:52:15','2025-03-04 00:52:15'),(6,'Canale S.A.','Canale','Gaona 1258','1122558877','canale@gmail.com','Hernan de la Serna','1155447788',1,'2025-03-04 17:25:14','2025-03-04 17:25:14'),(7,'Urquiza Panificados S.R.L.','Urquiza','1° de Agosto 5817, Villa Ballester','1145893298','ventas@brurin.com.ar','Walter Giardino','1122558745',1,'2025-03-25 19:34:39','2025-03-25 19:34:39'),(8,'Nestle Argentina S.A.','Nestle','Carlos Pellegrini 887 - CABA','1156568687','nestle@gmail.com','Alicia Mendez','1135784566',1,'2025-03-26 16:53:17','2025-03-26 16:53:17'),(9,'Molinos Rio de la Plata S.A.','Molinos','Ruta de la tradicción 3500 - 9 de abril - Bs. As.','08005554321','contacto@molinos.com.ar','Patricia Altamirano','1157856397',1,'2025-03-30 19:25:37','2025-03-30 19:25:37'),(10,'Compañia de Alimentos Fargo S.A.','Fargo','Av. Corrientes 330, Piso 6, Oficina 612, CABA','08001220240','fargo@gmail.com','Ernesto Piparo','1122486697',1,'2025-03-30 19:28:46','2025-03-30 19:28:46'),(11,'Fiambres Calchaqui S.R.L.','Calchaqui','El Arreo 220','1138669097','calchaqui@gmail.com','Pepe Parada','1138669097',1,'2025-03-30 19:35:53','2026-01-16 15:36:40'),(12,'Refres Now S.A.','Manaos','Brig. Juan Manuel de Rosas 25160 - Virrey del Pino - La Matanza','1156998721','manaos@gmail.com','Julian Alvarez','1154774556',1,'2025-03-31 16:53:04','2025-03-31 16:53:04'),(13,'Cabo Blanco Total S.A.','Cabo Blanco','Gran Piran 852, Aldo Bonzi, La Matanza','1144789554','caboblanco@gmail.com','Enzo Fernandez','1199877472',1,'2025-03-31 17:59:19','2025-03-31 17:59:19'),(14,'Unilever de Argentina S.A.','Knorr','Alf. H. Bouchard 4191 - Munro - Vicente Lopez','080088886436','knorr@gmail.com','Calitos Tevez','1132445752',1,'2025-03-31 18:03:47','2025-03-31 18:03:47'),(15,'Mastellone San Luis S.A.','La Serenisima','Ruta Prov. N° 2 B Km 1,5, Villa Mercedes. San Luis','08005553243','laserenisima@gmail.com','Pedro Parada','1155875632',1,'2025-04-08 17:56:10','2025-04-08 18:01:00'),(16,'La Perla S.A.','La Perla','Juan Austin Garcia 2752 6 A','1138661609','nataliaoduber@gmail.com','Pedro Parada','1155875632',1,'2025-04-15 03:30:52','2025-04-15 03:30:52'),(17,'Sideral SRL','Kevin','Juan de los palotes 1231 - Uruguay','1136998877','sideral@gmail.com','Pedro Aznar','1122547899',1,'2025-12-28 22:00:40','2025-12-28 22:08:00'),(18,'Cuidado Personal SRL','OFF','Juan Agustin Garcia 6 A','1138669097','cuidado@gmail.com','Alicia Ferraro','1155875632',1,'2026-01-06 11:20:23','2026-01-06 11:20:23'),(19,'Minerva Srl','Minerva','Juan Agustin Garcia 6 A','1138669097','minerva@gmail.com','Pedro Parada','1138669097',1,'2026-01-14 21:53:19','2026-01-14 21:53:19'),(20,'Proveedor Bebidas General','Coca Cola','Juan Agustin Garcia 6 A','1138669097','bebidas@gmail.com','Alicia Ferraro','1138669097',1,'2026-01-17 01:04:37','2026-01-17 01:04:37'),(21,'Cultura en Limpieza SRL','Cultura en Limpieza','Carlos Pellegrini 887 - CABA','1138669097','cultura@gmail.com','Pepe Parada','1138669097',1,'2026-01-18 00:20:38','2026-01-18 00:20:38'),(22,'Maxiconsumo Mayorista S.A.','Varias','Coletora 1254 - La Reja','1138669097','maxiconsumo@gmail.com','Karina Gonzalez','1138669097',1,'2026-01-18 00:23:29','2026-01-18 00:23:29'),(23,'Nevares S.A.','Nevares','Juan Agustin Garcia 6 A','1138669097','nevares@gmail.com','Pedro Scaloni','1138669097',1,'2026-01-18 00:24:26','2026-01-18 00:24:26'),(24,'Nescafe S.A.','Dolca','Juan Agustin Garcia 6 A','1138669097','nescafe@gmail.com','Pedro Aznar','1138669097',1,'2026-01-18 02:51:17','2026-01-18 02:51:33');
/*!40000 ALTER TABLE `proveedors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `retiros_caja`
--

DROP TABLE IF EXISTS `retiros_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `retiros_caja` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `arqueo_id` bigint(20) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `motivo` varchar(255) DEFAULT 'Retiro de seguridad',
  `usuario_id` int(11) NOT NULL,
  `caja_id` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retiros_caja`
--

LOCK TABLES `retiros_caja` WRITE;
/*!40000 ALTER TABLE `retiros_caja` DISABLE KEYS */;
/*!40000 ALTER TABLE `retiros_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(1,2),(2,1),(2,2),(3,1),(3,2),(4,1),(4,2),(5,1),(5,2),(6,1),(6,2),(7,1),(7,2),(8,1),(8,2),(9,1),(9,2),(10,1),(10,2),(11,1),(11,2),(12,1),(12,2),(13,1),(13,2),(14,1),(14,2),(15,1),(15,2),(16,1),(16,2),(17,1),(17,2),(18,1),(18,2),(19,1),(19,2);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador',NULL,NULL),(2,'Cajero/a',NULL,NULL),(3,'Compras',NULL,NULL),(4,'Deposito',NULL,NULL),(5,'Vigilancia',NULL,NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sistema_licencia`
--

DROP TABLE IF EXISTS `sistema_licencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sistema_licencia` (
  `id` int(11) NOT NULL DEFAULT 1,
  `serial_autorizado` varchar(255) NOT NULL,
  `cliente_nombre` varchar(255) DEFAULT NULL,
  `fecha_activacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sistema_licencia`
--

LOCK TABLES `sistema_licencia` WRITE;
/*!40000 ALTER TABLE `sistema_licencia` DISABLE KEYS */;
INSERT INTO `sistema_licencia` VALUES (1,'YS20220950001068','Cliente Morrone','2026-01-17 05:33:03');
/*!40000 ALTER TABLE `sistema_licencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tmp_compras`
--

DROP TABLE IF EXISTS `tmp_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmp_compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `precio_compra` decimal(12,2) DEFAULT 0.00,
  `precio_anterior` decimal(18,2) DEFAULT 0.00,
  `mejor_precio` decimal(18,2) DEFAULT 0.00,
  `mejor_proveedor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tmp_compras_producto_id_foreign` (`producto_id`),
  CONSTRAINT `tmp_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tmp_compras`
--

LOCK TABLES `tmp_compras` WRITE;
/*!40000 ALTER TABLE `tmp_compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `tmp_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tmp_devoluciones`
--

DROP TABLE IF EXISTS `tmp_devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmp_devoluciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tmp_devoluciones_producto_id_foreign` (`producto_id`),
  KEY `tmp_devoluciones_combo_id_foreign` (`combo_id`),
  CONSTRAINT `fk_tmp_devoluciones_combos` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tmp_devoluciones_productos` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tmp_devoluciones`
--

LOCK TABLES `tmp_devoluciones` WRITE;
/*!40000 ALTER TABLE `tmp_devoluciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `tmp_devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tmp_ventas`
--

DROP TABLE IF EXISTS `tmp_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmp_ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tmp_ventas_producto_id_foreign` (`producto_id`),
  KEY `tmp_ventas_combo_id_foreign` (`combo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=440 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tmp_ventas`
--

LOCK TABLES `tmp_ventas` WRITE;
/*!40000 ALTER TABLE `tmp_ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tmp_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidads`
--

DROP TABLE IF EXISTS `unidads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unidads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unidads_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidads`
--

LOCK TABLES `unidads` WRITE;
/*!40000 ALTER TABLE `unidads` DISABLE KEYS */;
INSERT INTO `unidads` VALUES (1,'Unidad','Unitario',1,'2025-03-28 22:20:25','2025-03-28 22:20:25'),(2,'Kilogramos','Kilogramos',1,'2025-03-28 22:20:53','2025-04-04 18:07:20'),(3,'Gramos','Gramos',1,'2025-03-28 22:21:31','2025-04-04 18:07:04'),(4,'Litros','Litros',1,NULL,NULL);
/*!40000 ALTER TABLE `unidads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `user_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `user_roles_role_id_foreign` (`role_id`),
  CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(2,2),(5,3),(6,2);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_empresa_id_foreign` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@admin.com',NULL,'$2y$12$kXT4glz/JrN5Lbl0S7JWbuX2nKWNNOKVx8Ch7pTLEMDGvwmlEuwEa',1,NULL,'2025-03-03 16:37:54','2025-12-24 23:50:37'),(2,'Carla Almiron','carla@gmail.com',NULL,'$2y$12$CFBJpUEBt0G94/ozClDdX.ei6UgTKRrzYDTGj4kNxhy2vopuqzF8u',1,NULL,'2025-04-10 14:20:22','2025-04-10 14:20:22'),(3,'Federico Molinari','federico@gmail.com',NULL,'$2y$12$VyI9s2wS56tk5ZBlJ7sl0OtD4UV8ZMwc7WW6MDiuSe42LD8Bco/B6',1,NULL,'2025-04-10 15:31:45','2025-04-10 15:31:45'),(4,'Pedro Artazar','pedroartazar@gmail.com',NULL,'$2b$10$44oLCa7Z6IUhcZUBmgKrD.7tq/XjnAhp/Uuy3QbgGK/KzmM/d0tM2',1,NULL,NULL,NULL),(5,'Diego Varela','diegovarela@gmail.com',NULL,'$2b$10$0KBPv5qX6IXZPFQxDW/jfeM.n0D8XbosC7GfaDeko0icHnkzFsHdi',1,NULL,NULL,NULL),(6,'Walter Trinidad','walter@gmail.com',NULL,'$2b$10$/51VqPJssyiJTOhCf.1bDOwhdFMLY37IJQlk/OfhmcoSoo9/iH7Cy',1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `puntos_ganados` int(11) DEFAULT 0,
  `puntos_canjeados` int(11) DEFAULT 0,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `descuento_monto` decimal(8,2) DEFAULT 0.00,
  `efectivo` decimal(8,2) DEFAULT 0.00,
  `tarjeta` decimal(8,2) DEFAULT 0.00,
  `mercadopago` decimal(8,2) DEFAULT 0.00,
  `transferencia` decimal(10,2) NOT NULL DEFAULT 0.00,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned DEFAULT NULL,
  `arqueo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `es_cuenta_corriente` tinyint(1) NOT NULL DEFAULT 0,
  `duracion_segundos` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ventas_cliente_id_foreign` (`cliente_id`),
  KEY `ventas_usuario_id_foreign` (`usuario_id`),
  KEY `fk_ventas_arqueos` (`arqueo_id`),
  CONSTRAINT `fk_ventas_arqueos` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,'2026-01-01',6000.00,0,0,0.00,0.00,6000.00,0.00,0.00,0.00,1,1,1,1,1,'2026-01-01 22:44:11','2026-01-20 22:44:11',0,43),(2,'2026-01-01',5800.00,0,0,0.00,0.00,5800.00,0.00,0.00,0.00,1,1,1,1,1,'2026-01-01 22:54:47','2026-01-20 22:54:47',0,12),(3,'2026-01-02',14400.00,0,0,0.00,0.00,14400.00,0.00,0.00,0.00,1,1,1,1,2,'2026-01-02 23:39:39','2026-01-20 23:39:39',0,39),(4,'2026-01-02',10800.00,0,0,0.00,0.00,10800.00,0.00,0.00,0.00,1,1,1,1,2,'2026-01-02 13:58:53','2026-01-21 13:58:53',0,36),(5,'2026-01-03',11000.00,110,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,3,3,'2026-01-03 15:13:51','2026-01-21 15:13:51',1,62),(6,'2026-01-03',19000.00,0,0,0.00,0.00,19000.00,0.00,0.00,0.00,1,1,1,1,3,'2026-01-03 18:36:53','2026-01-21 18:36:53',0,76),(7,'2026-01-04',10600.00,0,0,0.00,0.00,10600.00,0.00,0.00,0.00,1,2,2,1,4,'2026-01-04 19:20:49','2026-01-21 19:20:49',0,57),(8,'2026-01-04',6700.00,0,0,0.00,0.00,0.00,0.00,6700.00,0.00,1,2,2,1,4,'2026-01-05 00:30:28','2026-01-22 00:30:28',0,79);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-21 21:32:50
