import logging
from . import (robot as _robot_module,
               instruments as inst,
               containers as cnt,
               modules)
from opentrons.config import pipette_config

log = logging.getLogger(__name__)
# Ignore the type here because well, this is exactly why this is the legacy_api
robot = _robot_module.Robot()  # type: ignore
modules.provide_singleton(robot)

LOG = logging.getLogger(__name__)


def reset():
    robot.reset()
    return robot


class ContainersWrapper(object):
    def __init__(self, robot):
        self.robot = robot

    def create(self, *args, **kwargs):
        return cnt.create(*args, **kwargs)

    def list(self, *args, **kwargs):
        return cnt.list(*args, **kwargs)

    def load(self, container_name, slot, label=None, share=False):
        try:
            return cnt.load(self.robot, container_name, slot, label, share)
        except FileNotFoundError:
            LOG.exception(f"Exception opening labware {container_name}")
            raise RuntimeError(
                f"Could not load labware {container_name}")


class InstrumentsWrapper(object):
    def __init__(self, robot):
        self.robot = robot

    def Pipette(self, *args, **kwargs):
        """
        Deprecated -- do not use this constructor directly. Use the model-
        specific constructors available in this module.
        """
        return inst.Pipette(self.robot, *args, **kwargs)

    def _pipette_details(self, mount, name_or_model):
        pipette_model_version = self.retrieve_version_number(
            mount, name_or_model)
        attached = self.robot.get_attached_pipettes()
        if attached[mount]['model'] == pipette_model_version\
           and attached[mount]['id']\
           and attached[mount]['id'] != 'uncommissioned':
            pip_id = attached[mount]['id']
        else:
            pip_id = None
        return (pipette_model_version, pip_id)

    def P10_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p10_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P10_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p10_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P20_Plus_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p+20_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P50_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p50_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P50_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p50_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P300_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p300_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P300_Plus_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p+300_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P300_Multi(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p300_multi',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P1000_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p1000_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def P1000_Plus_Single(
            self,
            mount,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        return self.pipette_by_name(mount, 'p+1000_single',
                                    trash_container, tip_racks,
                                    aspirate_flow_rate, dispense_flow_rate,
                                    min_volume, max_volume)

    def pipette_by_name(
            self,
            mount,
            name_or_model,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):
        pipette_model_version, pip_id = self._pipette_details(
            mount, name_or_model)
        config = pipette_config.load(pipette_model_version, pip_id)

        if pip_id and name_or_model not in pipette_model_version:
            log.warning(
                f"Using a deprecated constructor for {pipette_model_version}")
            constructor_config = pipette_config.name_config()[name_or_model]
            config = config._replace(
                min_volume=constructor_config['minVolume'],
                max_volume=constructor_config['maxVolume'])
        return self._create_pipette_from_config(
            config=config,
            mount=mount,
            name=pipette_model_version,
            trash_container=trash_container,
            tip_racks=tip_racks,
            aspirate_flow_rate=aspirate_flow_rate,
            dispense_flow_rate=dispense_flow_rate,
            min_volume=min_volume,
            max_volume=max_volume)

    def _create_pipette_from_config(
            self,
            config,
            mount,
            name,
            trash_container='',
            tip_racks=[],
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            min_volume=None,
            max_volume=None):

        if aspirate_flow_rate is not None:
            config = config._replace(aspirate_flow_rate=aspirate_flow_rate)
        if dispense_flow_rate is not None:
            config = config._replace(dispense_flow_rate=dispense_flow_rate)

        if min_volume is not None:
            config = config._replace(min_volume=min_volume)
        if max_volume is not None:
            config = config._replace(max_volume=max_volume)
        plunger_positions = {
            'top': config.top,
            'bottom': config.bottom,
            'blow_out': config.blow_out,
            'drop_tip': config.drop_tip}
        p = self.Pipette(
            model_offset=config.model_offset,
            mount=mount,
            name=name,
            trash_container=trash_container,
            tip_racks=tip_racks,
            channels=config.channels,
            aspirate_flow_rate=config.aspirate_flow_rate,
            dispense_flow_rate=config.dispense_flow_rate,
            min_volume=config.min_volume,
            max_volume=config.max_volume,
            plunger_current=config.plunger_current,
            drop_tip_current=config.drop_tip_current,
            drop_tip_speed=config.drop_tip_speed,
            plunger_positions=plunger_positions,
            ul_per_mm=config.ul_per_mm,
            pick_up_current=config.pick_up_current,
            pick_up_distance=config.pick_up_distance,
            pick_up_increment=config.pick_up_increment,
            pick_up_presses=config.pick_up_presses,
            pick_up_speed=config.pick_up_speed,
            quirks=config.quirks,
            fallback_tip_length=config.tip_length)  # TODO move to labware

        return p

    def retrieve_version_number(self, mount, expected_model_substring):
        if pipette_config.HAS_MODEL_RE.match(expected_model_substring):
            return expected_model_substring

        attached_model = robot.get_attached_pipettes()[mount]['model']

        if attached_model and\
                'p+20' in attached_model and 'p10' in expected_model_substring:
            # Special use-case where volume does not match, but we still
            # want a valid model name to be passed
            if attached_model.split('_')[1] ==\
                    expected_model_substring.split('_')[1]:
                return attached_model

        if attached_model and expected_model_substring in attached_model:
            return attached_model
        elif attached_model and '+' in attached_model and\
                expected_model_substring.split('p')[1] in\
                attached_model.split('+')[1]:
            # Allow for backwards compatibility in old pipette constructors
            return attached_model
        else:
            # pass a default pipette model-version for when robot is simulating
            # this allows any pipette to be simulated, regardless of what is
            # actually attached/cached on the robot's mounts
            #
            # from all available config models that match the expected string,
            # pick the first one for simulation
            return list(filter(
                lambda m: expected_model_substring in m,
                pipette_config.config_models))[0]


instruments = InstrumentsWrapper(robot)
containers = ContainersWrapper(robot)
labware = ContainersWrapper(robot)
modules.provide_labware(labware)


__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset', 'modules']
