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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ajustes`
--

LOCK TABLES `ajustes` WRITE;
/*!40000 ALTER TABLE `ajustes` DISABLE KEYS */;
INSERT INTO `ajustes` VALUES (1,2,1,'salida',1.00,'Robo','2025-04-10 15:13:00',1,'2025-04-10 18:14:36','2025-04-10 18:14:36'),(2,15,1,'entrada',2.00,'Mal conteo','2025-04-10 15:27:00',1,'2025-04-10 18:28:19','2025-04-10 18:28:19'),(3,15,1,'entrada',1.00,'Se encontro tirado en el deposito','2026-01-05 13:58:00',1,'2026-01-05 17:00:51','2026-01-05 17:00:51');
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
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `fecha_apertura` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_inicial` decimal(10,2) DEFAULT NULL,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `ventas_efectivo` decimal(10,2) DEFAULT 0.00,
  `ventas_tarjeta` decimal(10,2) DEFAULT 0.00,
  `ventas_mercadopago` decimal(10,2) DEFAULT 0.00,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `arqueos_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `arqueos_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arqueos`
--

LOCK TABLES `arqueos` WRITE;
/*!40000 ALTER TABLE `arqueos` DISABLE KEYS */;
INSERT INTO `arqueos` VALUES (1,1,1,'2026-01-03 09:00:00','2026-01-03 22:25:00',10000.00,26100.00,13000.00,0.00,13100.00,'Apertura Matutina','2026-01-04 02:52:24','2026-01-04 15:26:07'),(2,1,1,'2026-01-04 09:00:00','2026-01-04 20:00:00',10000.00,13100.00,13100.00,0.00,0.00,'Apertura Matutina','2026-01-04 15:26:51','2026-01-05 19:01:31'),(3,1,1,'2026-01-05 09:00:00','2026-01-05 20:00:00',10000.00,27700.00,1400.00,5900.00,20400.00,'Apertura Matutina','2026-01-05 21:34:04','2026-01-06 13:46:37'),(4,1,1,'2026-01-06 07:50:00','2026-01-06 21:08:00',15000.00,42500.00,29600.00,0.00,12900.00,'Apertura Matutina','2026-01-06 13:51:24','2026-01-07 03:08:47'),(5,1,1,'2026-01-07 09:00:00','2026-01-07 20:00:00',10000.00,22400.00,10000.00,0.00,12400.00,'Apertura Matutina','2026-01-08 05:32:07','2026-01-08 05:53:51'),(6,1,1,'2026-01-08 09:00:00','2026-01-08 22:06:00',10000.00,10000.00,10000.00,0.00,0.00,'Apertura Matutina','2026-01-08 16:29:03','2026-01-09 10:06:38'),(7,1,1,'2026-01-09 09:00:00',NULL,10000.00,NULL,0.00,0.00,0.00,'Apertura Matutina','2026-01-09 17:11:43','2026-01-09 17:11:43');
/*!40000 ALTER TABLE `arqueos` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorias_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Bebidas sin alcohol','Bebidas naturales, juegos, gaceosas, agua.',1,'2025-03-03 18:23:29','2025-03-03 18:23:29'),(2,'Bebidas alcohólicas','Vinos, cervesas, wiskys, espumantes',1,'2025-03-03 18:24:49','2025-03-03 18:24:49'),(3,'Pastas','Todo relacionado a las pastas (fideos secos, pastas caseras, etc)',1,'2025-03-03 19:23:46','2025-03-03 19:23:46'),(4,'Galletitas','Todo tipo de galletitas',1,'2025-03-03 20:17:49','2025-03-03 20:17:49'),(5,'Productos enlatados','todos los enlatados',1,'2025-03-04 14:18:44','2025-03-04 14:18:44'),(6,'Almacen','Productos en Polvo, Productos Instantaneos',1,'2025-03-26 13:39:45','2025-03-31 14:41:07'),(7,'Fiambrería','Productos de Fiambrería',1,'2025-03-30 15:46:34','2025-03-30 15:46:34'),(8,'Panaderia','Productos Panificados',1,'2025-03-30 16:11:28','2025-03-30 16:11:28'),(9,'Productos lácteos','Queso rallado',1,'2025-04-08 14:48:20','2025-04-08 14:48:20'),(10,'Perfumeria','Perfumes, dewsodorantes, porductos de limpieza personal',0,NULL,NULL),(14,'Cuidado Personal','repelentes tópicos (en crema, loción, spray para la piel)',0,NULL,NULL);
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
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `categorias_gastos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_gastos`
--

LOCK TABLES `categorias_gastos` WRITE;
/*!40000 ALTER TABLE `categorias_gastos` DISABLE KEYS */;
INSERT INTO `categorias_gastos` VALUES (1,'Alquiler',1,'2026-01-05 19:06:09','2026-01-05 19:06:09'),(2,'Luz/Agua/Gas',1,'2026-01-05 19:06:09','2026-01-05 19:06:09'),(3,'Internet',1,'2026-01-05 19:06:09','2026-01-05 19:06:09'),(4,'Sueldos',1,'2026-01-05 19:06:09','2026-01-05 19:06:09'),(5,'Limpieza',1,'2026-01-05 19:06:09','2026-01-05 19:06:09'),(6,'Otros',1,'2026-01-05 19:06:09','2026-01-05 19:06:09');
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
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Consumidor Final','00000000000','99999999','consumidorfinal@gmail.com',1,'2025-03-03 23:31:59','2025-03-03 23:31:59'),(2,'Morrone Pablo Martín','22362590','1138669097','morronepablo@gmail.com',1,'2025-03-04 17:47:48','2025-03-04 17:47:48'),(3,'Natalia Oduber','94654750','1138661609','nataliaoduber@gmail.com',1,'2025-04-05 22:50:51','2025-04-05 22:50:51'),(4,'Gustavo Vessani','20221349877','1122334455','gustavo@gmail.com',1,'2026-01-02 05:08:34','2026-01-02 05:08:34'),(5,'Diego Martin Trinidad','25369785','1122556548','diegotrinidad@gmail.com',1,'2026-01-06 11:58:54','2026-01-06 11:58:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_producto`
--

LOCK TABLES `combo_producto` WRITE;
/*!40000 ALTER TABLE `combo_producto` DISABLE KEYS */;
INSERT INTO `combo_producto` VALUES (1,1,1,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(2,1,6,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(3,1,4,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(4,2,3,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(5,2,2,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(6,2,10,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(7,2,9,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(10,3,12,250,'2025-03-31 14:32:59','2025-03-31 14:32:59'),(11,3,13,250,'2025-03-31 14:32:59','2025-03-31 14:32:59'),(15,4,1,1,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(16,4,2,2,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(17,4,9,1,'2026-01-06 13:41:05','2026-01-06 13:41:05');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combos`
--

LOCK TABLES `combos` WRITE;
/*!40000 ALTER TABLE `combos` DISABLE KEYS */;
INSERT INTO `combos` VALUES (1,'Combo Navidad','1001',10000.00,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(2,'Combo Invierno','1002',6000.00,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(3,'Combo Jamon y Queso 500g','1003',5800.00,1,'2025-03-30 16:46:55','2025-03-30 16:46:55'),(4,'Combo Reyes','1004',5000.00,1,'2026-01-03 03:07:46','2026-01-06 13:41:05');
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
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `compras_proveedor_id_foreign` (`proveedor_id`),
  KEY `compras_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,'2026-01-04','FACTURA - 00000001',34500.00,0.00,1,1,10,'2026-01-04 13:07:35','2026-01-04 13:07:35'),(2,'2026-01-04','FACTURA - 00000001',31000.00,0.00,1,1,4,'2026-01-04 14:52:03','2026-01-04 14:52:03'),(3,'2026-01-06','FACTURA - 00000009',30000.00,0.00,1,1,9,'2026-01-06 11:13:39','2026-01-06 11:13:39'),(4,'2026-01-06','FACTURA - 00000001',30000.00,20000.00,1,1,18,'2026-01-06 11:23:13','2026-01-06 11:23:13');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras_cta_cte`
--

LOCK TABLES `compras_cta_cte` WRITE;
/*!40000 ALTER TABLE `compras_cta_cte` DISABLE KEYS */;
INSERT INTO `compras_cta_cte` VALUES (1,5,NULL,3,4000.00,NULL,'deuda','2026-01-03',1,'2026-01-04 02:40:28','2026-01-04 02:40:28'),(2,7,NULL,3,3600.00,NULL,'deuda','2026-01-04',1,'2026-01-04 15:01:17','2026-01-04 15:01:17'),(3,NULL,NULL,3,600.00,'efectivo','pago','2026-01-06',1,'2026-01-06 12:01:08','2026-01-06 12:01:08'),(4,12,NULL,3,7100.00,NULL,'deuda','2026-01-06',1,'2026-01-06 12:26:49','2026-01-06 12:26:49'),(5,13,NULL,4,6600.00,NULL,'deuda','2026-01-06',1,'2026-01-06 13:34:20','2026-01-06 13:34:20'),(6,NULL,NULL,3,2100.00,'efectivo','pago','2026-01-09',1,'2026-01-09 14:14:38','2026-01-09 14:14:38'),(7,NULL,NULL,3,3000.00,'efectivo','pago','2026-01-09',1,'2026-01-09 14:26:29','2026-01-09 14:26:29'),(8,17,NULL,5,8900.00,NULL,'deuda','2026-01-09',1,'2026-01-09 15:48:52','2026-01-09 15:48:52');
/*!40000 ALTER TABLE `compras_cta_cte` ENABLE KEYS */;
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
INSERT INTO `config_sessions` VALUES (1,'horas',1,'2026-01-05 23:32:55');
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
  `compra_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_compras_compra_id_foreign` (`compra_id`),
  KEY `detalle_compras_producto_id_foreign` (`producto_id`),
  CONSTRAINT `detalle_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
INSERT INTO `detalle_compras` VALUES (1,20,1,14,'2026-01-04 13:07:35','2026-01-04 13:07:35'),(2,20,2,4,'2026-01-04 14:52:03','2026-01-04 14:52:03'),(3,20,3,15,'2026-01-06 11:13:39','2026-01-06 11:13:39'),(4,20,4,32,'2026-01-06 11:23:13','2026-01-06 11:23:13');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_devoluciones`
--

LOCK TABLES `detalle_devoluciones` WRITE;
/*!40000 ALTER TABLE `detalle_devoluciones` DISABLE KEYS */;
INSERT INTO `detalle_devoluciones` VALUES (1,1,1,29,NULL,'2026-01-04 02:25:54','2026-01-04 02:25:54'),(2,1,2,9,NULL,'2026-01-05 18:47:38','2026-01-05 18:47:38'),(3,1,3,20,NULL,'2026-01-06 13:46:44','2026-01-06 13:46:44');
/*!40000 ALTER TABLE `detalle_devoluciones` ENABLE KEYS */;
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
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_ventas_venta_id_foreign` (`venta_id`),
  KEY `detalle_ventas_producto_id_foreign` (`producto_id`),
  KEY `detalle_ventas_combo_id_foreign` (`combo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas`
--

LOCK TABLES `detalle_ventas` WRITE;
/*!40000 ALTER TABLE `detalle_ventas` DISABLE KEYS */;
INSERT INTO `detalle_ventas` VALUES (1,1,1,15,NULL,'2026-01-04 02:22:19','2026-01-04 02:22:19'),(2,1,2,NULL,1,'2026-01-04 02:22:55','2026-01-04 02:22:55'),(3,1,3,4,NULL,'2026-01-04 02:23:23','2026-01-04 02:23:23'),(4,1,4,29,NULL,'2026-01-04 02:23:55','2026-01-04 02:23:55'),(5,1,5,31,NULL,'2026-01-04 02:40:28','2026-01-04 02:40:28'),(6,1,6,4,NULL,'2026-01-04 14:56:55','2026-01-04 14:56:55'),(7,1,7,9,NULL,'2026-01-04 15:01:17','2026-01-04 15:01:17'),(8,1,8,4,NULL,'2026-01-05 18:34:55','2026-01-05 18:34:55'),(9,1,8,9,NULL,'2026-01-05 18:34:55','2026-01-05 18:34:55'),(10,1,9,31,NULL,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(11,1,9,15,NULL,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(12,1,9,9,NULL,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(13,1,9,4,NULL,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(14,1,10,24,NULL,'2026-01-05 20:36:30','2026-01-05 20:36:30'),(15,1,10,21,NULL,'2026-01-05 20:36:30','2026-01-05 20:36:30'),(16,1,11,32,NULL,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(17,1,11,9,NULL,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(18,1,11,15,NULL,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(19,1,11,24,NULL,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(20,1,12,4,NULL,'2026-01-06 12:26:49','2026-01-06 12:26:49'),(21,1,12,31,NULL,'2026-01-06 12:26:49','2026-01-06 12:26:49'),(22,1,13,32,NULL,'2026-01-06 13:34:20','2026-01-06 13:34:20'),(23,1,13,9,NULL,'2026-01-06 13:34:20','2026-01-06 13:34:20'),(24,1,14,20,NULL,'2026-01-06 13:45:04','2026-01-06 13:45:04'),(25,1,15,31,NULL,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(26,1,15,4,NULL,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(27,1,15,15,NULL,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(28,1,15,1,NULL,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(29,1,15,7,NULL,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(30,1,16,9,NULL,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(31,1,16,15,NULL,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(32,1,16,10,NULL,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(33,1,17,NULL,3,'2026-01-09 15:48:52','2026-01-09 15:48:52'),(34,1,17,4,NULL,'2026-01-09 15:48:52','2026-01-09 15:48:52'),(35,1,18,16,NULL,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(36,1,18,27,NULL,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(37,1,18,9,NULL,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(38,1,18,1,NULL,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(39,1,18,14,NULL,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(40,1,19,32,NULL,'2026-01-09 16:05:23','2026-01-09 16:05:23'),(41,1,19,15,NULL,'2026-01-09 16:05:23','2026-01-09 16:05:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devoluciones`
--

LOCK TABLES `devoluciones` WRITE;
/*!40000 ALTER TABLE `devoluciones` DISABLE KEYS */;
INSERT INTO `devoluciones` VALUES (1,NULL,'2026-01-03',1000.00,'',1,NULL,1,'2026-01-04 02:25:54','2026-01-04 02:25:54'),(2,NULL,'2026-01-05',3600.00,'',1,NULL,1,'2026-01-05 18:47:38','2026-01-05 18:47:38'),(3,NULL,'2026-01-06',1350.00,'',1,NULL,1,'2026-01-06 13:46:44','2026-01-06 13:46:44');
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
INSERT INTO `empresas` VALUES (1,'Argentina','Morrone Ventas','Comercial','12345678','1138669097','admin@admin.com',21,'Iva','$','Juan Agustin Garcia 6 A','Buenos Aires','Villa Santa Rita','1416','logo-1766939244318-216285233.png','2025-03-05 01:37:54','2025-12-26 08:50:37');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos`
--

LOCK TABLES `gastos` WRITE;
/*!40000 ALTER TABLE `gastos` DISABLE KEYS */;
INSERT INTO `gastos` VALUES (1,20000.00,'Pago Luz Diciembre','2026-01-05 16:40:00',2,'mercadopago',1,1,3,'2026-01-05 19:41:55','2026-01-05 19:41:55'),(2,5000.00,'Pago a changarin','2026-01-05 16:42:00',6,'efectivo',1,1,3,'2026-01-05 19:43:21','2026-01-05 19:43:21'),(3,1000.00,'Limpieza de mueble','2026-01-06 10:52:00',5,'efectivo',1,1,4,'2026-01-06 13:52:55','2026-01-06 13:52:55');
/*!40000 ALTER TABLE `gastos` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (1,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:35:52'),(2,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 22:36:09'),(3,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:36:59'),(4,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 horas','::1',1,'2026-01-05 22:46:10'),(5,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 22:46:21'),(6,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:46:50'),(7,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 22:50:23'),(8,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:50:28'),(9,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 minutos','::1',1,'2026-01-05 22:50:40'),(10,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 22:50:57'),(11,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:51:03'),(12,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 22:54:29'),(13,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:54:35'),(14,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 22:59:42'),(15,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 22:59:50'),(16,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 minutos','::1',1,'2026-01-05 23:03:31'),(17,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:03:35'),(18,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:03:44'),(19,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 minutos','::1',1,'2026-01-05 23:09:04'),(20,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:09:38'),(21,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:10:01'),(22,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:17:05'),(23,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:17:13'),(24,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:25:43'),(25,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-05 23:26:43'),(26,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:28:57'),(27,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 horas','::1',1,'2026-01-05 23:29:08'),(28,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:29:15'),(29,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:29:23'),(30,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:29:52'),(31,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:29:59'),(32,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 minutos','::1',1,'2026-01-05 23:30:06'),(33,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:30:12'),(34,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:30:19'),(35,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-05 23:31:23'),(36,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:32:45'),(37,1,'EDITAR','CONFIGURACION_SESION','Se cambió la duración de sesión a: 1 horas','::1',1,'2026-01-05 23:32:55'),(38,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-05 23:33:00'),(39,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-05 23:33:08'),(40,1,'EDITAR','CONFIGURACION_EMPRESA','Se actualizaron los datos de la empresa: Morrone Ventas','::1',1,'2026-01-05 23:42:04'),(41,1,'CREAR','USUARIOS','Se registró un nuevo usuario: walter@gmail.com (Nombre: Walter TRinidad)','::1',1,'2026-01-06 00:03:24'),(42,1,'EDITAR','USUARIOS','Se actualizaron los datos y roles del usuario: carla@gmail.com (ID: 2)','::1',1,'2026-01-06 00:04:57'),(43,1,'CREAR','SEGURIDAD_ROLES','Se creó el rol: Vigilancia','::1',1,'2026-01-06 00:16:42'),(44,1,'EDITAR','SEGURIDAD_ROLES','Se cambió el nombre del rol ID 5 a: Vigilancia','::1',1,'2026-01-06 00:17:18'),(45,1,'EDITAR','SEGURIDAD_ROLES','Se actualizaron los permisos para el rol: Administrador (Cant: 17)','::1',1,'2026-01-06 00:18:12'),(46,1,'EDITAR','SEGURIDAD_ROLES','Se actualizaron los permisos para el rol: Administrador (Cant: 18)','::1',1,'2026-01-06 00:19:09'),(47,1,'CREAR','SEGURIDAD_PERMISOS','Se creó un nuevo permiso: ver_logs','::1',1,'2026-01-06 00:24:42'),(48,1,'EDITAR','SEGURIDAD_PERMISOS','Se actualizó el permiso ID 12. Nuevo nombre: ver_arqueos','::1',1,'2026-01-06 00:25:42'),(49,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 00:33:11'),(50,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 00:46:15'),(51,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 09:52:56'),(52,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-06 09:55:14'),(53,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 09:55:20'),(54,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-06 10:06:12'),(55,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 10:06:18'),(56,1,'EDITAR','CATEGORIAS','Se actualizó la categoría ID 14. Nuevo nombre: Cuidado Personal','::1',1,'2026-01-06 10:22:24'),(57,1,'CREAR','UNIDADES','Se creó la unidad de medida: Litros','::1',1,'2026-01-06 10:29:47'),(58,1,'EDITAR','UNIDADES','Se actualizó la unidad ID 4. Nuevo nombre: Litros','::1',1,'2026-01-06 10:30:30'),(59,1,'CREAR','PRODUCTOS','Se registró el producto: Crema Repelente de Insectos OFF Family 60g (Código: 77980755)','::1',1,'2026-01-06 10:41:33'),(60,1,'EDITAR','PRODUCTOS','Se actualizó el producto: Crema Repelente de Insectos OFF Family 60g (ID: 32)','::1',1,'2026-01-06 10:43:04'),(61,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $15000','::1',1,'2026-01-06 10:51:24'),(62,1,'CREAR','ARQUEO_MOVIMIENTO','Movimiento manual de Ingreso: $50000. Motivo: Compra de mercaderia','::1',1,'2026-01-06 10:53:07'),(63,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 11:10:53'),(64,1,'CREAR','COMPRAS','Se registró una compra de $30000. Comprobante: FACTURA - 00000009. Proveedor ID: 9','::1',1,'2026-01-06 11:13:39'),(65,1,'CREAR','PROVEEDORES','Se registró al proveedor: Cuidado Personal SRL (Marca: OFF)','::1',1,'2026-01-06 11:20:23'),(66,1,'CREAR','COMPRAS','Se registró una compra de $30000. Comprobante: FACTURA - 00000001. Proveedor ID: 18','::1',1,'2026-01-06 11:23:13'),(67,1,'PAGO','PROVEEDORES','Se registró un pago al proveedor ID: 4 por $undefined','::1',1,'2026-01-06 11:35:05'),(68,1,'PAGO','PROVEEDORES','Se registró un pago al proveedor ID: 18 por un total de $5.000,00 vía banco','::1',1,'2026-01-06 11:39:38'),(69,1,'PAGO','PROVEEDORES','Se registró un pago al proveedor ID: 18 por un total de $5.000,00 vía efectivo','::1',1,'2026-01-06 11:40:31'),(70,1,'CREAR','CLIENTES','Se registró al cliente: Diego Martin Trinidad (CUIL: 25369785)','::1',1,'2026-01-06 11:58:54'),(71,1,'PAGO','CLIENTES_CTA_CTE','Se registró un pago de $600 para el cliente ID: 3','::1',1,'2026-01-06 12:01:08'),(72,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 12:10:57'),(73,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 12:11:56'),(74,1,'CREAR','VENTAS','Se registró una venta por un total de $12900. Ticket N°: 11. Cliente ID: 1','::1',1,'2026-01-06 12:24:24'),(75,1,'CREAR','VENTAS','Se registró una venta por un total de $7100. Ticket N°: 12. Cliente ID: 3','::1',1,'2026-01-06 12:26:49'),(76,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 13:11:57'),(77,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 13:12:45'),(78,1,'CREAR','VENTAS','Se registró una venta por un total de $6600. Ticket N°: 13. Cliente ID: 4','::1',1,'2026-01-06 13:34:20'),(79,1,'EDITAR','COMBOS','Se actualizaron los datos del combo: Combo Reyes (ID: 4)','::1',1,'2026-01-06 13:41:05'),(80,1,'CREAR','VENTAS','Se registró una venta por un total de $1350. Ticket N°: 14. Cliente ID: 1','::1',1,'2026-01-06 13:45:04'),(81,1,'CREAR','DEVOLUCIONES','Se registró la devolución N° 3 por un total de $1350. Motivo: No especificado','::1',1,'2026-01-06 13:46:44'),(82,1,'CREAR','GASTOS','Se registró un gasto por $1000 (efectivo). Descripción: Limpieza de mueble','::1',1,'2026-01-06 13:52:55'),(83,1,'EDITAR','SEGURIDAD_ROLES','Se actualizaron los permisos para el rol: Administrador (Cant: 19)','::1',1,'2026-01-06 13:58:18'),(84,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-06 13:58:25'),(85,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 13:58:37'),(86,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 14:58:43'),(87,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 15:06:47'),(88,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 16:06:59'),(89,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 16:06:59'),(90,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 16:06:59'),(91,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 16:12:39'),(92,1,'BACKUP','SISTEMA','Se descargó una copia de seguridad de la base de datos.','::1',1,'2026-01-06 16:30:02'),(93,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-06 17:12:39'),(94,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 18:06:53'),(95,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-06 19:03:56'),(96,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 00:06:53'),(97,1,'EDITAR','ARQUEO_CAJA','Cierre de caja realizado. ID Arqueo: 4. Monto final reportado: $42500','::1',1,'2026-01-07 00:08:47'),(98,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-07 00:42:06'),(99,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 17:18:20'),(100,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-07 17:18:27'),(101,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 17:21:39'),(102,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-07 17:21:45'),(103,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 18:51:40'),(104,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-07 19:52:22'),(105,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 19:53:22'),(106,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 21:27:11'),(107,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-07 23:09:44'),(108,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-07 23:09:56'),(109,1,'BACKUP','SISTEMA','Se descargó una copia de seguridad de la base de datos.','::1',1,'2026-01-07 23:26:06'),(110,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-07 23:26:28'),(111,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-08 02:30:42'),(112,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-08 02:32:07'),(113,1,'CREAR','VENTAS','Se registró una venta por un total de $12400. Ticket N°: 15. Cliente ID: 1','::1',1,'2026-01-08 02:33:29'),(114,1,'EDITAR','ARQUEO_CAJA','Cierre de caja realizado. ID Arqueo: 5. Monto final reportado: $22400','::1',1,'2026-01-08 02:53:51'),(115,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-08 13:28:24'),(116,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-08 13:29:03'),(117,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-08 14:28:58'),(118,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-08 14:30:45'),(119,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-09 07:05:12'),(120,1,'EDITAR','ARQUEO_CAJA','Cierre de caja realizado. ID Arqueo: 6. Monto final reportado: $10000','::1',1,'2026-01-09 07:06:38'),(121,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-09 13:38:00'),(122,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-09 14:11:43'),(123,1,'PAGO','CLIENTES_CTA_CTE','Se registró un pago de $1100 para el cliente ID: 3','::1',1,'2026-01-09 14:14:38'),(124,1,'EDITAR','CLIENTES_CTA_CTE','Se actualizó el pago ID: 6. Cambios: FECHA: \"Fri Jan 09 2026 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2026-01-09\" | IMPORTE: \"1100.00\" ➡️ \"2100.00\"','::1',1,'2026-01-09 14:25:23'),(125,1,'PAGO','CLIENTES_CTA_CTE','Se registró un pago de $3000 para el cliente ID: 3','::1',1,'2026-01-09 14:26:29'),(126,1,'LOGOUT','AUTENTICACION','Sesión cerrada automáticamente por vencimiento de token','::1',1,'2026-01-09 14:38:11'),(127,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-09 14:46:59'),(128,1,'EDITAR','SEGURIDAD_ROLES','Se actualizaron permisos del rol: Cajero/a. ANTERIORES: [Ninguno] ➡️ NUEVOS: [ver_empresa, ver_productos, ver_clientes, ver_ventas, ver_arqueos, ver_devoluciones, ver_ajustes, ver_movimientos, ver_gastos]','::1',1,'2026-01-09 15:13:38'),(129,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-09 15:13:51'),(130,2,'LOGIN','AUTENTICACION','El usuario carla@gmail.com inició sesión','::1',1,'2026-01-09 15:14:08'),(131,2,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-09 15:20:36'),(132,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-09 15:20:47'),(133,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-09 15:22:41'),(134,2,'LOGIN','AUTENTICACION','El usuario carla@gmail.com inició sesión','::1',1,'2026-01-09 15:22:55'),(135,2,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-09 15:41:19'),(136,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-09 15:41:30'),(137,1,'CREAR','VENTAS','Se registró una venta por un total de $7800. Ticket N°: 16. Cliente ID: 1','::1',1,'2026-01-09 15:44:32'),(138,1,'CREAR','VENTAS','Se registró una venta por un total de $8900. Ticket N°: 17. Cliente ID: 5','::1',1,'2026-01-09 15:48:52'),(139,1,'CREAR','VENTAS','Se registró una venta por un total de $12150. Ticket N°: 18. Cliente ID: 1','::1',1,'2026-01-09 16:03:16'),(140,1,'CREAR','VENTAS','Se registró una venta por un total de $6000. Ticket N°: 19. Cliente ID: 1','::1',1,'2026-01-09 16:05:23');
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
  `pago_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `movimiento_cajas_arqueo_id_foreign` (`arqueo_id`),
  CONSTRAINT `movimiento_cajas_arqueo_id_foreign` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_cajas`
--

LOCK TABLES `movimiento_cajas` WRITE;
/*!40000 ALTER TABLE `movimiento_cajas` DISABLE KEYS */;
INSERT INTO `movimiento_cajas` VALUES (1,'Ingreso',3000.00,'Venta Ticket N° 1',1,NULL,'2026-01-04 02:22:19','2026-01-04 02:22:19'),(2,'Ingreso',10000.00,'Venta Ticket N° 2',1,NULL,'2026-01-04 02:22:55','2026-01-04 02:22:55'),(3,'Ingreso',3100.00,'Venta Ticket N° 3',1,NULL,'2026-01-04 02:23:23','2026-01-04 02:23:23'),(4,'Ingreso',1000.00,'Venta Ticket N° 4',1,NULL,'2026-01-04 02:23:55','2026-01-04 02:23:55'),(5,'Egreso',1000.00,'Devolución N° 1',1,NULL,'2026-01-04 02:25:54','2026-01-04 02:25:54'),(6,'Ingreso',3100.00,'Venta Ticket N° 6',2,NULL,'2026-01-04 14:56:55','2026-01-04 14:56:55'),(7,'Ingreso',6700.00,'Venta Ticket N° 8',3,NULL,'2026-01-05 18:34:55','2026-01-05 18:34:55'),(8,'Egreso',3600.00,'Devolución N° 2',3,NULL,'2026-01-05 18:47:38','2026-01-05 18:47:38'),(9,'Egreso',5000.00,'Gasto: Pago a changarin',3,NULL,'2026-01-05 19:43:21','2026-01-05 19:43:21'),(10,'Ingreso',13700.00,'Venta Ticket N° 9',3,NULL,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(11,'Ingreso',5900.00,'Venta Ticket N° 10',3,NULL,'2026-01-05 20:36:30','2026-01-05 20:36:30'),(12,'Ingreso',50000.00,'Compra de mercaderia',4,NULL,'2026-01-06 13:53:07','2026-01-06 13:53:07'),(13,'Egreso',30000.00,'Pago inicial compra - FACTURA - 00000009',4,NULL,'2026-01-06 11:13:39','2026-01-06 11:13:39'),(14,'Egreso',5000.00,'Pago a proveedor (Cta. Cte.)',4,NULL,'2026-01-06 11:40:31','2026-01-06 11:40:31'),(15,'Ingreso',600.00,'Pago Cta. Cte. Cliente: Natalia Oduber',4,1,'2026-01-06 12:01:08','2026-01-06 12:01:08'),(16,'Ingreso',12900.00,'Venta Ticket N° 11',4,NULL,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(17,'Ingreso',1350.00,'Venta Ticket N° 14',4,NULL,'2026-01-06 13:45:04','2026-01-06 13:45:04'),(18,'Egreso',1350.00,'Devolución N° 3',4,NULL,'2026-01-06 13:46:44','2026-01-06 13:46:44'),(19,'Egreso',1000.00,'Gasto: Limpieza de mueble',4,NULL,'2026-01-06 13:52:55','2026-01-06 13:52:55'),(20,'Ingreso',12400.00,'Venta Ticket N° 15',5,NULL,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(21,'Ingreso',2100.00,'Pago Cta. Cte. Cliente: Natalia Oduber',7,2,'2026-01-09 14:14:38','2026-01-09 14:25:22'),(22,'Ingreso',3000.00,'Pago Cta. Cte. Cliente: Natalia Oduber',7,3,'2026-01-09 14:26:29','2026-01-09 14:26:29'),(23,'Ingreso',7800.00,'Venta Ticket N° 16',7,NULL,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(24,'Ingreso',12150.00,'Venta Ticket N° 18',7,NULL,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(25,'Ingreso',10000.00,'Venta Ticket N° 19',7,NULL,'2026-01-09 16:05:23','2026-01-09 16:05:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos`
--

LOCK TABLES `movimientos` WRITE;
/*!40000 ALTER TABLE `movimientos` DISABLE KEYS */;
INSERT INTO `movimientos` VALUES (1,14,1,'entrada','compra',1,1,NULL,NULL,NULL,20.00,'2026-01-04 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(2,4,1,'entrada','compra',2,2,NULL,NULL,NULL,20.00,'2026-01-04 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(3,15,1,'salida','venta',1,NULL,1,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(4,4,1,'salida','venta',3,NULL,3,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(5,29,1,'salida','venta',4,NULL,4,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(6,31,1,'salida','venta',5,NULL,5,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(7,4,1,'salida','venta',6,NULL,6,NULL,NULL,1.00,'2026-01-04 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(8,9,1,'salida','venta',7,NULL,7,NULL,NULL,1.00,'2026-01-04 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(9,1,1,'salida','venta',2,NULL,2,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(10,6,1,'salida','venta',2,NULL,2,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(11,4,1,'salida','venta',2,NULL,2,NULL,NULL,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(12,29,1,'entrada','devolucion',1,NULL,NULL,NULL,1,1.00,'2026-01-03 00:00:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(13,2,1,'salida','ajuste',1,NULL,NULL,1,NULL,1.00,'2025-04-10 15:13:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(14,15,1,'entrada','ajuste',2,NULL,NULL,2,NULL,2.00,'2025-04-10 15:27:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(15,15,1,'entrada','ajuste',3,NULL,NULL,3,NULL,1.00,'2026-01-05 13:58:00',1,'2026-01-05 18:19:30','2026-01-05 18:19:30'),(16,4,1,'salida','venta',8,NULL,8,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 18:34:55','2026-01-05 18:34:55'),(17,9,1,'salida','venta',8,NULL,8,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 18:34:55','2026-01-05 18:34:55'),(18,9,1,'entrada','devolucion',2,NULL,NULL,NULL,2,1.00,'2026-01-05 00:00:00',1,'2026-01-05 18:47:38','2026-01-05 18:47:38'),(19,31,1,'salida','venta',9,NULL,9,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(20,15,1,'salida','venta',9,NULL,9,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(21,9,1,'salida','venta',9,NULL,9,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(22,4,1,'salida','venta',9,NULL,9,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 20:35:22','2026-01-05 20:35:22'),(23,24,1,'salida','venta',10,NULL,10,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 20:36:30','2026-01-05 20:36:30'),(24,21,1,'salida','venta',10,NULL,10,NULL,NULL,1.00,'2026-01-05 00:00:00',1,'2026-01-05 20:36:30','2026-01-05 20:36:30'),(25,15,1,'entrada','compra',3,3,NULL,NULL,NULL,20.00,'2026-01-06 00:00:00',1,'2026-01-06 11:13:39','2026-01-06 11:13:39'),(26,32,1,'entrada','compra',4,4,NULL,NULL,NULL,20.00,'2026-01-06 00:00:00',1,'2026-01-06 11:23:13','2026-01-06 11:23:13'),(27,32,1,'salida','venta',11,NULL,11,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(28,9,1,'salida','venta',11,NULL,11,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(29,15,1,'salida','venta',11,NULL,11,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(30,24,1,'salida','venta',11,NULL,11,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 12:24:24','2026-01-06 12:24:24'),(31,4,1,'salida','venta',12,NULL,12,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 12:26:49','2026-01-06 12:26:49'),(32,31,1,'salida','venta',12,NULL,12,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 12:26:49','2026-01-06 12:26:49'),(33,32,1,'salida','venta',13,NULL,13,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 13:34:20','2026-01-06 13:34:20'),(34,9,1,'salida','venta',13,NULL,13,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 13:34:20','2026-01-06 13:34:20'),(35,20,1,'salida','venta',14,NULL,14,NULL,NULL,1.00,'2026-01-06 00:00:00',1,'2026-01-06 13:45:04','2026-01-06 13:45:04'),(36,20,1,'entrada','devolucion',3,NULL,NULL,NULL,3,1.00,'2026-01-06 00:00:00',1,'2026-01-06 13:46:44','2026-01-06 13:46:44'),(37,31,1,'salida','venta',15,NULL,15,NULL,NULL,1.00,'2026-01-07 00:00:00',1,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(38,4,1,'salida','venta',15,NULL,15,NULL,NULL,1.00,'2026-01-07 00:00:00',1,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(39,15,1,'salida','venta',15,NULL,15,NULL,NULL,1.00,'2026-01-07 00:00:00',1,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(40,1,1,'salida','venta',15,NULL,15,NULL,NULL,1.00,'2026-01-07 00:00:00',1,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(41,7,1,'salida','venta',15,NULL,15,NULL,NULL,1.00,'2026-01-07 00:00:00',1,'2026-01-08 02:33:29','2026-01-08 02:33:29'),(42,9,1,'salida','venta',16,NULL,16,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(43,15,1,'salida','venta',16,NULL,16,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(44,10,1,'salida','venta',16,NULL,16,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 15:44:32','2026-01-09 15:44:32'),(45,12,1,'salida','venta',17,NULL,17,NULL,NULL,250.00,'2026-01-09 00:00:00',1,'2026-01-09 15:48:52','2026-01-09 15:48:52'),(46,13,1,'salida','venta',17,NULL,17,NULL,NULL,250.00,'2026-01-09 00:00:00',1,'2026-01-09 15:48:52','2026-01-09 15:48:52'),(47,4,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 15:48:52','2026-01-09 15:48:52'),(48,16,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(49,27,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(50,9,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(51,1,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(52,14,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:03:16','2026-01-09 16:03:16'),(53,32,1,'salida','venta',19,NULL,19,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:05:23','2026-01-09 16:05:23'),(54,15,1,'salida','venta',19,NULL,19,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-09 16:05:23','2026-01-09 16:05:23');
/*!40000 ALTER TABLE `movimientos` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago_compras`
--

LOCK TABLES `pago_compras` WRITE;
/*!40000 ALTER TABLE `pago_compras` DISABLE KEYS */;
INSERT INTO `pago_compras` VALUES (1,1,10,1,1,34500.00,'banco','2026-01-04','2026-01-04 13:07:35','2026-01-04 13:07:35'),(2,3,9,1,1,30000.00,'efectivo','2026-01-06','2026-01-06 11:13:39','2026-01-06 11:13:39'),(3,2,4,1,1,31000.00,'banco','2026-01-06','2026-01-06 11:35:05','2026-01-06 11:35:05'),(4,4,18,1,1,5000.00,'banco','2026-01-06','2026-01-06 11:39:38','2026-01-06 11:39:38'),(5,4,18,1,1,5000.00,'efectivo','2026-01-06','2026-01-06 11:40:31','2026-01-06 11:40:31');
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
  `arqueo_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pagos_venta_id_foreign` (`venta_id`),
  KEY `pagos_cliente_id_foreign` (`cliente_id`),
  KEY `pagos_compra_cta_cte_id_foreign` (`compra_cta_cte_id`),
  KEY `pagos_empresa_id_foreign` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,NULL,3,3,600.00,'efectivo','2026-01-06','Pago de Cuenta Corriente',1,4,'2026-01-06 12:01:08',NULL),(2,NULL,3,6,2100.00,'efectivo','2026-01-09','Pago de Cuenta Corriente',1,7,'2026-01-09 14:14:38',NULL),(3,NULL,3,7,3000.00,'efectivo','2026-01-09','Pago de Cuenta Corriente',1,7,'2026-01-09 14:26:29',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'7790070336217','Fideos Mostachol N°52 Matarazzo 500g','FIDEOS MOSTACHOL 52 MATA','',NULL,46,20,10000,600.00,1200.00,1,100.00,'2025-03-03',3,1,1,'2025-03-03 19:26:32','2026-01-09 16:03:16'),(2,'7790040139657','Merengadas Bagley 88g','MERENGADAS.BAGLEY','',NULL,99,20,1000,550.00,1100.00,1,100.00,'2025-03-03',4,1,1,'2025-03-03 20:20:59','2026-01-04 12:35:31'),(3,'7790040677005','Tortitas sabor chocolate Arcor 152g','ARCOR TORTITAS CHO','',NULL,42,20,1000,600.00,1200.00,1,100.00,'2025-03-03',4,1,1,'2025-03-03 20:22:36','2026-01-04 12:36:50'),(4,'7790895000218','Coca Cola 2L Env. Retornable','COCA COLA ENV. RET','',NULL,32,10,10000,1550.00,3100.00,1,100.00,'2025-03-03',1,1,1,'2025-03-03 21:45:31','2026-01-09 15:48:52'),(5,'7791270336998','Vino Luigi Bosca - Tinto - Malbec - 750ml','VINO LUIGI TITNO MALBEC','',NULL,10,5,100,9600.00,14400.00,1,50.00,'2025-03-03',2,1,1,'2025-03-03 21:57:38','2026-01-04 12:37:41'),(6,'7798132920848','Tomate Perita Clasico - Canale 400g','LATA PERITA CANALE 400G',NULL,NULL,38,10,500,800.00,1600.00,1,100.00,'2025-03-04',5,1,1,'2025-03-04 14:23:23','2026-01-04 02:22:55'),(7,'7798177401296','Galletitas Saladas con Queso Talitas Urquiza','URQUIZA/CINDA.QUESO','Talitas con Queso',NULL,38,10,10000,550.00,1100.00,1,100.00,'2025-03-03',4,1,1,'2025-03-25 16:31:45','2026-01-08 02:33:29'),(8,'7798177401449','Galletitas Sabor Cheddar Talitas Urquiza','URQUIZA/CINDA.CHED','Talitas Cheddar',NULL,57,10,10000,550.00,1100.00,1,100.00,'2025-03-05',4,1,1,'2025-03-26 13:35:35','2025-12-31 11:55:42'),(9,'7613034449993','Chocolate en Polvo Nesquik 360g Nestle','NESQUIK NESTLE 360G','Chocolate en Polvo',NULL,16,10,10000,1800.00,3600.00,1,100.00,'2025-03-05',6,1,1,'2025-03-26 13:48:00','2026-01-09 16:03:16'),(10,'7790070336200','Fideos Penne Rigate N°48 Matarazzo 500g','FIDEOS PENNE RIGATE MATA','',NULL,32,10,10000,600.00,1200.00,1,100.00,'2025-03-06',3,1,1,'2025-03-27 21:49:16','2026-01-09 15:44:32'),(11,'7790070320032','Fideos Municiones Matarazzo 500g','FIDEOS MUNICIONES MATA','',NULL,33,10,10000,600.00,1200.00,1,100.00,'2025-03-06',4,1,1,'2025-03-27 23:47:12','2026-01-04 12:33:46'),(12,'7899674034000','Jamon Cocido Calchaqui','JAMON COCIDO CALCHAQUI','',NULL,2000,1000,100000,5.80,11.60,1,100.00,'2025-03-20',7,3,1,'2025-03-30 16:07:32','2026-01-09 15:48:52'),(13,'7899674034001','Queso de Barra Calchaqui','QUESO BARRA CALCHAQUI','',NULL,2000,1000,100000,5.80,11.60,1,100.00,'2025-03-20',7,3,1,'2025-03-30 16:10:34','2026-01-09 15:48:52'),(14,'7793890258752','Lactal - Pan de Mesa - 460g. Fargo','LACTAL/PAN MESA','Pan lactal en paquete naylon',NULL,29,10,100,1725.00,3450.00,1,100.00,'2025-03-20',8,1,1,'2025-03-30 16:15:52','2026-01-09 16:03:16'),(15,'7790070562074','Chipá tipo caseros Lucchetti 400g','CHIPA LUCCHETTI 400G','',NULL,44,10,100,1500.00,3000.00,1,100.00,'2025-03-20',6,1,1,'2025-03-30 16:21:43','2026-01-09 16:05:23'),(16,'7798113301529','Soda Manaos 2L','SODA/MANAOS','',NULL,23,10,1000,750.00,1500.00,1,100.00,'2025-03-31',1,1,1,'2025-03-31 13:48:11','2026-01-09 16:03:16'),(17,'7795265005114','Mini Alfaj. R.  Maicena - Cabo Blanco 145gr.','CABO BLANCO MAICEN','',NULL,22,10,100,750.00,1500.00,1,100.00,'2025-03-31',4,1,1,'2025-03-31 14:49:58','2026-01-01 23:57:01'),(18,'7794000006379','Puré de Papas R. Completa - Knorr 125gr.','KNORR/PU.PAP.COMP',NULL,NULL,27,10,100,1350.00,2700.00,1,100.00,'2025-03-31',6,1,1,'2025-03-31 14:54:47','2025-12-31 02:59:13'),(19,'7790040139091','Merengadas Pack Bagley 264g','MERENGADAS PACK','',NULL,30,10,100,1350.00,2700.00,1,100.00,'2025-04-08',4,1,1,'2025-04-08 14:31:11','2026-01-01 23:56:43'),(20,'7790070507372','Jugo 100% Limon Minerva','MINERVA LIMON','',NULL,13,10,100,675.00,1350.00,1,100.00,'2025-04-08',1,1,1,'2025-04-08 14:38:58','2026-01-06 13:46:44'),(21,'7790742223005','Queso Rallado Reggianito La Serenisima 70g','QUESO RALLADO SERE','',NULL,48,10,100,1300.00,2600.00,1,100.00,'2025-04-08',9,1,1,'2025-04-08 14:51:02','2026-01-05 20:36:30'),(22,'7790742223203','Queso Rallado Reggianito La Serenisima 175g','SERE/QUESO.RALLADO','',NULL,16,10,100,3350.00,6700.00,1,100.00,'2025-04-08',9,1,1,'2025-04-08 14:53:07','2026-01-01 23:57:37'),(23,'7790742222909','Queso Rallado Reggianito La Serenisima 35g','SERE/QUESO.RALLA35','',NULL,48,10,100,600.00,1200.00,1,100.00,'2025-04-10',9,1,1,'2025-04-10 12:21:52','2026-01-01 23:58:13'),(24,'7790903001374','Lactal - Pan de Mesa - 550g. La Perla','LA PERLA/PAN TRADI','',NULL,41,10,100,1650.00,3300.00,1,100.00,'2025-04-14',8,1,1,'2025-04-15 00:28:39','2026-01-06 12:24:24'),(27,'7798149754221','Repelente de Insectos spray 200 ml','REPEL-INSECT-SP-200','',NULL,19,10,100,1200.00,2400.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 17:08:53','2026-01-09 16:03:16'),(28,'7791293048031','Desodorante Dove Meb + care 150 ml','DESO-DOVE-CARE-150','',NULL,19,10,100,1100.00,2200.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 18:50:33','2026-01-02 01:23:54'),(29,'7501054550563','Curitas Transpiel 40','CURITA-TRANS-40','',NULL,18,10,100,500.00,1000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-04 02:25:54'),(30,'7790520014214','Lysoform Desinfectante 360 cm3','LYSO-DESIN-360','',NULL,20,10,100,1500.00,3000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2025-12-29 17:54:08'),(31,'7791600065478','Caro Cuore Desodorante 123 ml','CARO-CUORE-123','',NULL,15,10,100,2000.00,4000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-08 02:33:29'),(32,'77980755','Crema Repelente de Insectos OFF Family 60g','OFF-CREAMA-60','Crema Repelente de Insectos',NULL,37,10,100,1500.00,3000.00,1,100.00,'2026-01-06',14,1,1,'2026-01-06 10:41:33','2026-01-09 16:05:23');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedors`
--

LOCK TABLES `proveedors` WRITE;
/*!40000 ALTER TABLE `proveedors` DISABLE KEYS */;
INSERT INTO `proveedors` VALUES (1,'Matarazzo Hnos.','Matarazzo','Rivadavia 1752 - CABA','1122556688','matarazzo@gmail.com','Juan Ernesto Sabato','1122558877',1,'2025-03-03 22:30:45','2025-03-03 22:30:45'),(2,'Arcor Hnos.','Arcor','Guaemes 2754 - CABA','11447744','arcor@gmail.com','Pedro Scaloni','11447788',1,'2025-03-03 23:25:31','2025-03-03 23:25:31'),(3,'Bagley S.A.','Bagley','Moreno 741 - CABA','11336699','bagley@gmail.com','Alicia Ferraro','11887755',1,'2025-03-03 23:26:43','2025-03-03 23:26:43'),(4,'Coca Cola - FEMESA','Coca Cola','Amancio Alcorta 3570 - Pompeya','1146308999','cocacola@gmail.com','Juan Agustin Garcia','1138669097',1,'2025-03-04 00:41:29','2025-03-04 00:41:29'),(5,'Capri Distribuidora SRL','Capri','Luis Braille 5655 - CABA','1131758262','capri@gmail.com','Pepe Argento','1155778955',1,'2025-03-04 00:52:15','2025-03-04 00:52:15'),(6,'Canale S.A.','Canale','Gaona 1258','1122558877','canale@gmail.com','Hernan de la Serna','1155447788',1,'2025-03-04 17:25:14','2025-03-04 17:25:14'),(7,'Urquiza Panificados S.R.L.','Urquiza','1° de Agosto 5817, Villa Ballester','1145893298','ventas@brurin.com.ar','Walter Giardino','1122558745',1,'2025-03-25 19:34:39','2025-03-25 19:34:39'),(8,'Nestle Argentina S.A.','Nestle','Carlos Pellegrini 887 - CABA','1156568687','nestle@gmail.com','Alicia Mendez','1135784566',1,'2025-03-26 16:53:17','2025-03-26 16:53:17'),(9,'Molinos Rio de la Plata S.A.','Molinos','Ruta de la tradicción 3500 - 9 de abril - Bs. As.','08005554321','contacto@molinos.com.ar','Patricia Altamirano','1157856397',1,'2025-03-30 19:25:37','2025-03-30 19:25:37'),(10,'Compañia de Alimentos Fargo S.A.','Fargo','Av. Corrientes 330, Piso 6, Oficina 612, CABA','08001220240','fargo@gmail.com','Ernesto Piparo','1122486697',1,'2025-03-30 19:28:46','2025-03-30 19:28:46'),(11,'Fiambres Calchaqui S.R.L.','Calchaqui','El Arreo 220','1144189384','calchaqui@gmail.com','Pepe Parada','1145887895',1,'2025-03-30 19:35:53','2025-03-30 19:35:53'),(12,'Refres Now S.A.','Manaos','Brig. Juan Manuel de Rosas 25160 - Virrey del Pino - La Matanza','1156998721','manaos@gmail.com','Julian Alvarez','1154774556',1,'2025-03-31 16:53:04','2025-03-31 16:53:04'),(13,'Cabo Blanco Total S.A.','Cabo Blanco','Gran Piran 852, Aldo Bonzi, La Matanza','1144789554','caboblanco@gmail.com','Enzo Fernandez','1199877472',1,'2025-03-31 17:59:19','2025-03-31 17:59:19'),(14,'Unilever de Argentina S.A.','Knorr','Alf. H. Bouchard 4191 - Munro - Vicente Lopez','080088886436','knorr@gmail.com','Calitos Tevez','1132445752',1,'2025-03-31 18:03:47','2025-03-31 18:03:47'),(15,'Mastellone San Luis S.A.','La Serenisima','Ruta Prov. N° 2 B Km 1,5, Villa Mercedes. San Luis','08005553243','laserenisima@gmail.com','Pedro Parada','1155875632',1,'2025-04-08 17:56:10','2025-04-08 18:01:00'),(16,'La Perla S.A.','La Perla','Juan Austin Garcia 2752 6 A','1138661609','nataliaoduber@gmail.com','Pedro Parada','1155875632',1,'2025-04-15 03:30:52','2025-04-15 03:30:52'),(17,'Sideral SRL','Kevin','Juan de los palotes 1231 - Uruguay','1136998877','sideral@gmail.com','Pedro Aznar','1122547899',1,'2025-12-28 22:00:40','2025-12-28 22:08:00'),(18,'Cuidado Personal SRL','OFF','Juan Agustin Garcia 6 A','1138669097','cuidado@gmail.com','Alicia Ferraro','1155875632',1,'2026-01-06 11:20:23','2026-01-06 11:20:23');
/*!40000 ALTER TABLE `proveedors` ENABLE KEYS */;
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
INSERT INTO `role_has_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(4,2),(5,1),(6,1),(7,1),(7,2),(8,1),(9,1),(10,1),(10,2),(11,1),(11,2),(12,1),(12,2),(13,1),(14,1),(14,2),(15,1),(16,1),(16,2),(17,1),(17,2),(18,1),(18,2),(19,1);
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
  PRIMARY KEY (`id`),
  KEY `tmp_compras_producto_id_foreign` (`producto_id`),
  CONSTRAINT `tmp_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
INSERT INTO `users` VALUES (1,'Admin','admin@admin.com',NULL,'$2y$12$kXT4glz/JrN5Lbl0S7JWbuX2nKWNNOKVx8Ch7pTLEMDGvwmlEuwEa',1,NULL,'2025-03-03 16:37:54','2025-12-24 23:50:37'),(2,'Carla Almiron','carla@gmail.com',NULL,'$2y$12$CFBJpUEBt0G94/ozClDdX.ei6UgTKRrzYDTGj4kNxhy2vopuqzF8u',1,NULL,'2025-04-10 14:20:22','2025-04-10 14:20:22'),(3,'Federico Molinari','federico@gmail.com',NULL,'$2y$12$VyI9s2wS56tk5ZBlJ7sl0OtD4UV8ZMwc7WW6MDiuSe42LD8Bco/B6',1,NULL,'2025-04-10 15:31:45','2025-04-10 15:31:45'),(4,'Pedro Artazar','pedroartazar@gmail.com',NULL,'$2b$10$44oLCa7Z6IUhcZUBmgKrD.7tq/XjnAhp/Uuy3QbgGK/KzmM/d0tM2',1,NULL,NULL,NULL),(5,'Diego Varela','diegovarela@gmail.com',NULL,'$2b$10$0KBPv5qX6IXZPFQxDW/jfeM.n0D8XbosC7GfaDeko0icHnkzFsHdi',1,NULL,NULL,NULL),(6,'Walter TRinidad','walter@gmail.com',NULL,'$2b$10$/51VqPJssyiJTOhCf.1bDOwhdFMLY37IJQlk/OfhmcoSoo9/iH7Cy',1,NULL,NULL,NULL);
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
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `descuento_monto` decimal(8,2) DEFAULT 0.00,
  `efectivo` decimal(8,2) DEFAULT 0.00,
  `tarjeta` decimal(8,2) DEFAULT 0.00,
  `mercadopago` decimal(8,2) DEFAULT 0.00,
  `transferencia` decimal(10,2) NOT NULL DEFAULT 0.00,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned DEFAULT NULL,
  `arqueo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `es_cuenta_corriente` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ventas_cliente_id_foreign` (`cliente_id`),
  KEY `ventas_usuario_id_foreign` (`usuario_id`),
  KEY `fk_ventas_arqueos` (`arqueo_id`),
  CONSTRAINT `fk_ventas_arqueos` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,'2026-01-03',3000.00,0.00,0.00,3000.00,0.00,0.00,0.00,1,1,1,1,'2026-01-04 02:22:19','2026-01-04 02:22:19',0),(2,'2026-01-03',10000.00,0.00,0.00,0.00,0.00,10000.00,0.00,1,1,1,1,'2026-01-04 02:22:55','2026-01-04 02:22:55',0),(3,'2026-01-03',3100.00,0.00,0.00,0.00,0.00,3100.00,0.00,1,1,1,1,'2026-01-04 02:23:23','2026-01-04 02:23:23',0),(4,'2026-01-03',1000.00,0.00,0.00,1000.00,0.00,0.00,0.00,1,1,1,1,'2026-01-04 02:23:55','2026-01-04 02:23:55',0),(5,'2026-01-03',4000.00,0.00,0.00,0.00,0.00,0.00,0.00,1,1,3,1,'2026-01-04 02:40:28','2026-01-04 02:40:28',1),(6,'2026-01-04',3100.00,0.00,0.00,3100.00,0.00,0.00,0.00,1,1,1,2,'2026-01-04 14:56:55','2026-01-04 14:56:55',0),(7,'2026-01-04',3600.00,0.00,0.00,0.00,0.00,0.00,0.00,1,1,3,2,'2026-01-04 15:01:17','2026-01-04 15:01:17',1),(8,'2026-01-05',6700.00,0.00,0.00,0.00,0.00,6700.00,0.00,1,1,1,3,'2026-01-05 18:34:55','2026-01-05 18:34:55',0),(9,'2026-01-05',13700.00,0.00,0.00,0.00,0.00,13700.00,0.00,1,1,1,3,'2026-01-05 20:35:22','2026-01-05 20:35:22',0),(10,'2026-01-05',5900.00,0.00,0.00,0.00,5900.00,0.00,0.00,1,1,1,3,'2026-01-05 20:36:30','2026-01-05 20:36:30',0),(11,'2026-01-06',12900.00,0.00,0.00,0.00,0.00,12900.00,0.00,1,1,1,4,'2026-01-06 12:24:24','2026-01-06 12:24:24',0),(12,'2026-01-06',7100.00,0.00,0.00,0.00,0.00,0.00,0.00,1,1,3,4,'2026-01-06 12:26:49','2026-01-06 12:26:49',1),(13,'2026-01-06',6600.00,0.00,0.00,0.00,0.00,0.00,0.00,1,1,4,4,'2026-01-06 13:34:20','2026-01-06 13:34:20',1),(14,'2026-01-06',1350.00,0.00,0.00,1350.00,0.00,0.00,0.00,1,1,1,4,'2026-01-06 13:45:04','2026-01-06 13:45:04',0),(15,'2026-01-07',12400.00,0.00,0.00,0.00,0.00,12400.00,0.00,1,1,1,5,'2026-01-08 02:33:29','2026-01-08 02:33:29',0),(16,'2026-01-09',7800.00,0.00,0.00,0.00,0.00,7800.00,0.00,1,1,1,7,'2026-01-09 15:44:32','2026-01-09 15:44:32',0),(17,'2026-01-09',8900.00,0.00,0.00,0.00,0.00,0.00,0.00,1,1,5,7,'2026-01-09 15:48:52','2026-01-09 15:48:52',1),(18,'2026-01-09',12150.00,0.00,0.00,0.00,0.00,0.00,12150.00,1,1,1,7,'2026-01-09 16:03:16','2026-01-09 16:03:16',0),(19,'2026-01-09',6000.00,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,7,'2026-01-09 16:05:23','2026-01-09 16:05:23',0);
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

-- Dump completed on 2026-01-09 13:11:02
